export default [

    {
        //the part after '#' in the url (so-called fragment):
        hash: "welcome",
        ///id of the target html element:
        target: "routerView",
        //the function that returns content to be rendered to the target html element:
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },

    {
        hash: "articles",
        target: "routerView",
        getTemplate: fetchAndDisplayArticles
    },

    {
        hash: "opinions",
        target: "routerView",
        getTemplate: createHtml4opinions
    },

    {
        hash: "addOpinion",
        target: "routerView",
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML
    },

    {
        hash: "calcPages",
        target: "routerView",
        getTemplate: calcTotal
    },


    {
        hash: "article",
        target: "routerView",
        getTemplate: fetchAndDisplayArticleDetail
    },

    {
        hash: "artInsert",
        target: "routerView",
        getTemplate: insertform
    },

    {
        hash: "artEdit",
        target: "routerView",
        getTemplate: editArticle
    },

    {
        hash: "artDelete",
        target: "routerView",
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

let currentpage = 1;
let pageCount = 0;

function calcTotal() {

    const url = `${urlBase}/article?tag=smodesign`;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            pageCount = (Math.ceil((responseJSON.meta.totalCount)/20));
            document.getElementById("articlesLink").href = `#articles/1/${pageCount}`;
        });
}

function fetchAndDisplayArticles(targetElm, current, total) {
    let offset = 0;

    current = parseInt(current);
    total = parseInt(total);
    const offsetcount = {
        currPage: current,
        pageCount: total
    };

    if (current > 1) {
        offsetcount.prevPage = current - 1;
    }

    if (current < total) {
        offsetcount.nextPage = current + 1;
    }

    currentpage = current;

    offset = (current * 20) - 20;

    let urlQuery = "";

    urlQuery = `?tag=smodesign&offset=${offset}&max=${articlesPerPage}`;

    const url = `${urlBase}/article${urlQuery}`;

    document.getElementById("articlesLink").href = `#articles/${current}/${pageCount}`;

    let articleList = [];

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            addArtDetailLink2ResponseJson(responseJSON);
            articleList = responseJSON.articles;

            return Promise.resolve();
        })
        .then(() => {
            let cntMap = articleList.map(
                article => fetch(`${urlBase}/article/${article.id}`)
            );

            return Promise.all(cntMap);
        })
        .then(cntResponses => {
            let failed = "";
            for (let response of cntResponses) {
                if (!response.ok) failed += response.url + " ";
            }
            if (failed === "") {
                return cntResponses;
            } else {
                return Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}.`));
            }
        })
        .then(cntResponses => {
            return Promise.all(cntResponses.map(response => response.json()))
        })
        .then(articles => {
            articles.forEach((article, index) => {
                articleList[index].content = article.content;
            });

            return Promise.resolve();
        })

        .then(() => {
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles").innerHTML,
                    articleList
                );
            document.getElementById(targetElm).innerHTML +=
                Mustache.render(
                    document.getElementById("template-pager").innerHTML,
                    offsetcount
                );
            })
        .catch(error => {
            const errMsgObj = {errMessage: error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
    window.location.hash = "#top";
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

function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
}

function insertform(targetElm, offsetFromHash, totalCountFromHash) {
    const log = {
        formTitle: "Add Article",
        formSubmitCall:  `addNewArticle(routerView,template-article,'${urlBase}')`,
        submitBtTitle : "Add article"

    };
    document.getElementById(targetElm).innerHTML =
    Mustache.render(
        document.getElementById("template-article-form").innerHTML,
        log
    );
    document.getElementById("articleForm").addEventListener("submit",event =>{
            event.preventDefault();
            addNewArticle("routerView","template-article",urlBase, offsetFromHash, totalCountFromHash);
        }
    );
    calcTotal();
}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}


function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash,forEdit,newArt) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            if(newArt){
                let defaultView = 'routerView';
                let artTemplate = 'template-article';

                responseJSON.formTitle="Article Add";
                responseJSON.formSubmitCall =
                    `addNewArticle(${defaultView},${artTemplate},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;

                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );

            }else if(forEdit){
                responseJSON.formTitle="Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;

                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
            }else{

                responseJSON.backLink=`#articles/${currentpage}/${pageCount}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink=`#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink=`#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }

        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });

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





