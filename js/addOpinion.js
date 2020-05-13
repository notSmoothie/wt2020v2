function processOpnFrmData(event) {
    event.preventDefault();

    let opinions = [];

    if (localStorage.myOpinions) {
        opinions = JSON.parse(localStorage.myOpinions);
    }

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

    window.location.hash = "#opinions";


    window.alert("Ďakujeme za Váš názor.");

}
