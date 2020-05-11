//an array, defining the routes
export default [

    {
        //the part after '#' in the url (so-called fragment):
        hash: "welcome",
        ///id of the target html element:
        target: "router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },

    {
        hash: "articles",
        target: "router-view",
        getTemplate: fetchAndDisplayArticles
    },

    {
        hash: "opinions",
        target: "router-view",
        getTemplate: createHtml4opinions
    },

    {
        hash: "addOpinion",
        target: "router-view",
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML
    },

    {
        hash: "article",
        target: "router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },

    {
        hash: "artAdd",
        target: "router-view",
        getTemplate: artAdd
    },

    {
        hash: "artEdit",
        target: "router-view",
        getTemplate: editArticle
    },

    {
        hash: "artDelete",
        target: "router-view",
        getTemplate: deleteArticle
    }

];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;

function createHtml4opinions(targetElm) {
    const opinionsFromStorage = localStorage.myOpinions;
    let opinions = [];

    if (opinionsFromStorage) {
        opinions = JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = opinion.willReturn ? "I will return to this page." : "Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}

function fetchAndDisplayArticles(targetElm, current, total) {
    let offset = current;
    const totalCount = total;

    current = parseInt(current);
    total = parseInt(total);
    const paging = {
        currPage: current,
        pageCount: total
    };

    if (current > 1) {
        paging.prevPage = current - 1;
    }

    if (current < total) {
        paging.nextPage = current + 1;
    }

    offset = (current * articlesPerPage) - 20;

    let urlQuery = "";

    urlQuery = `?offset=${offset}&max=${articlesPerPage}`;

    const url = `${urlBase}/article${urlQuery}`;

    document.getElementById("articlesLink").href = `#articles/${current}/10`;

    let listOfArticles = [];

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            addArtDetailLink2ResponseJson(responseJSON);
            listOfArticles = responseJSON.articles;

            return Promise.resolve();
        })
        .then(() => {
            let contentMap = listOfArticles.map(
                article => fetch(`${urlBase}/article/${article.id}`)
            );

            return Promise.all(contentMap);
        })
        .then(contentMapResponses => {
            let failed = "";
            for (let response of contentMapResponses) {
                if (!response.ok) failed += response.url + " ";
            }
            if (failed === "") {
                return contentMapResponses;
            } else {
                return Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}.`));
            }
        })
        .then(contentMapResponses => {
            return Promise.all(contentMapResponses.map(response => response.json()))
        })
        .then(articles => {
            articles.forEach((article, index) => {
                listOfArticles[index].content = article.content;
            });

            return Promise.resolve();
        })

        .then(() => {
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles").innerHTML,
                    listOfArticles
                );
            document.getElementById(targetElm).innerHTML +=
                Mustache.render(
                    document.getElementById("template-paging").innerHTML,
                    paging
                );
            window.location.hash = "#top";
        })
        .catch(error => {
            const errMsgObj = {errMessage: error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}

function addArtDetailLink2ResponseJson(responseJSON) {
    responseJSON.articles =
        responseJSON.articles.map(
            article => (
                {
                    ...article,
                    detailLink: `#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
                }
            )
        );
}

function deleteArticle(targetElm, id2Delete) {

    const outpElm = document.getElementById(targetElm);

    const deleteReqSettings =
        {
            method: 'DELETE'
        };

    document.getElementById(targetElm).innerHTML = `<div class="alert alert-info" role="alert">Attempting to delete article with id=${id2Delete}</div>`;

    fetch(`${urlBase}/article/${id2Delete}`, deleteReqSettings)
        .then(response => {
            if (response.ok) {
                outpElm.innerHTML += `<div class="alert alert-success" role="alert">Article successfully deleted.</div>`;
            } else {
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .catch(error => {
            outpElm.innerHTML += `<div class="alert alert-warning" role="alert">Attempt failed. Details: <br />  ${error}</div>`;
        });

}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments, false);
}


function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            if (forEdit) {
                responseJSON.formTitle = "Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle = "Save article";
                responseJSON.urlBase = urlBase;

                responseJSON.backLink = `#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
            } else {
                responseJSON.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink = `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink = `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }
        })
        .catch(error => { ////here we process all the failed promises
            const errMsgObj = {errMessage: error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}

function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments, true);
}

function artAdd(outputElement, urlBase) {
    addNewArticle(...arguments);
}

function addNewArticle(outputElement, serverUrl) {

    const articleElm = document.getElementById(targetElm);

    //1. Gather and check the form data

    const newArtData = {
        title: document.getElementById("title").value.trim(),
        content: document.getElementById("content").value.trim(),
        author: document.getElementById("author").value.trim()
    };

    if (!(newArtData.title && newArtData.content)) {
        window.alert("Please, enter article title and content");
        return;
    }

    if (!newArtData.author) {
        newArtData.author = "Anonymous";
    }


    //2. Set up the request


    const postReqSettings = //an object wih settings of the request
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify(newArtData)
        };


    //3. Execute the request


    fetch(`${serverUrl}/article`, postReqSettings)  //now we need the second parameter, an object wih settings of the request.
        .then(response => {      //fetch promise fullfilled (operation completed successfully)
            if (response.ok) {    //successful execution includes an error response from the server. So we have to check the return status of the response here.
                return response.json(); //we return a new promise with the response data in JSON to be processed
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .then(responseJSON => { //here we process the returned response data in JSON ...
            articleElm.innerHTML =
                `
                    <h2>Article successfully posted with id=${responseJSON.id}</h2>
                    <h3>${responseJSON.title}</h3><div>${responseJSON.content}
                `;
            console.log(responseJSON);
        })
        .catch(error => { ////here we process all the failed promises
            articleElm.innerHTML =
                `
                    <h2>Error reading data from the server</h2>
                    ${error}
                `;
        });
}


