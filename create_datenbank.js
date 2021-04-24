const xml2js = require('xml2js');
const fs = require('fs');
// const { type } = require('os');

const xml = fs.readFileSync('datenbank.xml');

//Talent.printclass = -1: profanes Talent
//Talent.printclass = 0: profanes Talent
//Talent.printclass = 1: Dolchzauber ? (16285)V
//Talent.printclass = 20: Begin Liturgien ? (21649)

xml2js.parseString(xml, { mergeAttrs: true }, (err, result) => {
    if (err) {
        throw err;
    }

    let datenbank = result.Datenbank

    console.log(datenbank.Fertigkeit)
    // console.log(typeof(datenbank.Fertigkeiten))
    // for (let fert of datenbank.Fertigkeiten) {
    //     console.log(fert)
    // }
    // console.log(result)
    // `result` is a JavaScript object
    // convert it to a JSON string
    // const json = JSON.stringify(result, null, 4);

    // save JSON in a file
    // fs.writeFileSync('datenbank.json', json);

    // return result

}); 


// console.log(datenbank.Fertigkeiten)

// // XML string to be parsed to JSON
// const xml = `<?xml version="1.0" encoding="UTF-8" ?>
//             <user id="1">
//                 <name>John Doe</name>
//                 <email>john.doe@example.com</email>
//                 <roles>
//                     <role>Member</role>
//                     <role>Admin</role>
//                 </roles>
//                 <admin>true</admin>
//             </user>`;

// convert XML to JSON
// xml2js.parseString(xml, { mergeAttrs: true }, (err, result) => {
// // xml2js.parseString(xml, (err, result) => {
//     if(err) {
//         throw err;
//     }

//     // `result` is a JavaScript object
//     // convert it to a JSON string
//     const json = JSON.stringify(result, null, 4);

//     // log JSON string
//     console.log(json);
    
// });
