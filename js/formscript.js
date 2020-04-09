function op2ht(opinion) {

    opinion.createdDate = (new Date(opinion.created)).toDateString();
    opinion.fName = opinion.name;
    opinion.mInfo = opinion.info;

    const template = document.getElementById("opinionHtml").innerHTML;
    const htmlWOp = Mustache.render(template, opinion);

    delete (opinion.createdDate);
    delete (opinion.fName)
    delete (opinion.mInfo)

    return htmlWOp;

}

function oa2ht(sourceData) {

    return sourceData.reduce((htmlWithOpinions, opn) => htmlWithOpinions + op2ht(opn), "");

}

let opinions = [];

const opinionsElm = document.getElementById("opinionsContainer");

if (localStorage.myOpinions) {
    opinions = JSON.parse(localStorage.myOpinions);
}

opinionsElm.innerHTML = oa2ht(opinions);

console.log(opinions);


let element = document.getElementById("formicka");

element.addEventListener
("submit", processForm);

element.addEventListener
("click", delfromForm);

function delfromForm() {
        let opinionses = [];
        if (localStorage.myOpinions) {
            opinions = JSON.parse(localStorage.myOpinions);
        }
        while (newOpinion = opinions.pop()){
            if ((Date.now() - new Date(newOpinion.created) < 8.64e+7))
            {
                opinionses.push(newOpinion);
            }
        }
        while (newOpinion = opinionses.pop()){
                opinions.push(newOpinion);
        }
        localStorage.myOpinions = JSON.stringify(opinions);

         while (opinionsContainer.firstChild) {
             opinionsContainer.removeChild(opinionsContainer.firstChild)
         }
          opinionsContainer.innerHTML = oa2ht(opinions);
    }

function processForm(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const url = document.getElementById("url").value.trim();
    const info = document.getElementById("info").value.trim();
    const radio_nazor = document.getElementById("nazor").checked;
    const radio_zlepsenie = document.getElementById("zlepsenie").checked;
    const accept = document.getElementById("accept").checked;
    const supp = document.getElementById("supp").value;

    const newOpinion =
        {
            name: name,
            email: email,
            accept: accept,
            url: url,
            info: info,
            radio_zlepsenie:  radio_zlepsenie,
            radio_nazor: radio_nazor,
            supp : supp,
            created: new Date()
        };

    console.log("New opinion:\n " + JSON.stringify(newOpinion));

    opinions.push(newOpinion);

    localStorage.myOpinions = JSON.stringify(opinions);

    window.alert("Ďakujeme za Váš názor.");
    console.log("New opinion added");
    console.log(opinions);

    opinionsElm.innerHTML += op2ht(newOpinion);



    element.reset();
}