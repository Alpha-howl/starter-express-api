const express = require("express");
//const $ = require("./djax.js");
const https = require('https');
const app = express();


function parseRequest(queryParameters, response) {
    // Here, queryParameters is a QueryParams object holding the body of the request
    // sendResponseFunc is the function which sends back the response for this
    // current request.

    // Now, we have access to the body of the request and we can use this
    // to call the neccessary functions and logic, after which 
    // send a response back to the front-end via the second
    // parameter

    const action = queryParameters.get("action");
    
    switch(action.toLowerCase()) {
        case "create-new-account":
            var [email, username, password] = [
                queryParameters.get("email") || "", 
                queryParameters.get("username") || "",
                queryParameters.get("password") || ""
            ];


            handleNewAccountCreation(email, username, password, response);
            break;
        
        case "log-user-in":
            var [usernameOrEmail, password] = [
                queryParameters.get("usernameOrEmail"),
                queryParameters.get("password")
            ];
            handleUserLoginAttempt(usernameOrEmail, password, response);
        break;

        case "log-user-out":
            var usernameOrEmail = queryParameters.get("usernameOrEmail");
            handleUserLogout(usernameOrEmail, response);
            break;
        
        case "delete-account":
            var [usernameOrEmail, password] = [
                queryParameters.get("usernameOrEmail"),
                queryParameters.get("password")
            ];
            handleAccountDeletion(usernameOrEmail, password, response);
            break;
        
        case "test-https":
            sendHttpsRequest(response);
            break;
        
        default:
            response.status(200).send("Error: unknown action:'" + action.toLowerCase() + "'");
            break;

    }

}



function sendHttpsRequest(response) {
    
    const postData = JSON.stringify({
        works: true
    });
    const postOpts = {
        host: "httpbin.org",
        path: "/post",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData)
        }
    };

    const body = [];
    const newReq = https.request(postOpts, result => {
        result.setEncoding("utf8");
        res.on("data", chunk => {
            console.log("Response");
            body.push(chunk);
        });
        res.on("end", () => {
            const parsedBody = Buffer.concat(body).toString();
            console.log("Request successful");
            response.status(200).send(parsedBody);
        });
        res.on("error", errr => { // res.error(err => ...
            // handle error
            response.status(422).send("Error occured");
            return;
        });
    });
    newReq.write(postData);
    newReq.end();
    response.status(200).send("Proba 9-10-11");


}




async function validateEmail(email) {
    let valid = true;
    let message;


    const emailParts = email.split("@"); // [name, domain]

    if(email.length > 253+64+10) {
    	valid = false;
    	message = "Email address is too long";
    } else if (emailParts.length != 2) {
    	valid = false;
    	message = "Email addresses must contain one @ sign.";
    } else if (emailParts[0].length > 63 || emailParts[1].length > 253 + 10) {
    	valid = false;
    	message = "The recipient's name must be under 64 characters long, and the domain part must be under 263 characters long.";
    } else if (emailParts[0].length === 0 || emailParts[1].length === 0) {
    	valid = false;
    	message = "The @ symbol cannot be at one end.";
    } else if (emailParts[0].search(/[^A-Za-z0-9!#$%&'*+\-/=?^_`{}|]/) != -1) {
    	valid = false;
    	message = "That email address contains an illegal character at position " + (emailParts[0].search(/[^A-Za-z0-9!#$%&'*+\-/=?^_`{}|]/) + 1) + ".";
    } else if(emailParts[1].search(/\./) === -1) {
    	valid = false;
    	message = "The domain name must have a period in it.";
    } /* else if((await executeSQL("SELECT userId FROM User WHERE email = ?", email, "s")).result.rows.length != 0) {
    	valid = false;
    	message = "That email address is already in use. Please try another one.";
    } */

    return {valid, message};
}
async function validatePassword(password) {
    /* 
    Rules:
        length >= 8
        length <= 30
        1 number
        1 lowercase letter
        1 capital letter OR special character out of...
        let allowedSpecChars = [".", " ", "-", "_"];
    */
   let valid = true;
   let message;
    if(password.length < 8) {
        valid = false;
        message = "Passwords must have 8 or more characters.";
    } else if(password.length > 30) {
        valid = false;
        message = "Passwords must have 30 or fewer characters.";
    } else if(password.search(/[0-9]/) === -1) {
        valid = false; 
        message = "Passwords must have at least one number.";
    } else if(password.search(/[a-z]/) === -1) {
        valid = false;
        message = "Passwords must have at least one lowercase letter.";
    } else if(password.search(/[A-Z]/) === -1 && password.search(/[\. \-\_]/) === -1) {
        valid = false;
        message = "Passwords must contain at least one capital letter, or one special character";
    } else if(password.search(/[^\. \-\_A-Za-z0-9]/) != -1) {
        valid = false;
        message = "Passwords may not contain any other character apart from the letters a-z, numbers, underscores, periods, spaces, and dashes.";
    }

    return {valid, message};
}
async function validateUsername(username) {
    let valid = true;
   	let message;

   	if(username.length < 3 || username.length > 100) {
   		valid = false;
   		message = "The username must have between 3 and 100 characters.";
   	} else if(username.search(/[^\w]/) != -1) {
   		valid = false;
   		message = "Usernames can only alphanumeric characters and underscores. Illegal detected at position " + username.search(/[^\w]/) + 1;
   	}/*  else if((await executeSQL("SELECT userId FROM User WHERE username = ?", username, "s")).result.rows.length != 0) {
   		valid = false;
   		message = "That username is already taken!";
   	} */


   	return {valid, message};
}



async function isValid(response, ...validationData) {
    let allValid = true;
    let message;

    for (let i = 0; i < validationData.length-1; i+=2) {
        const valueToValidate = validationData[i];
        const typeOfValue = validationData[i+1];
        let validationFn;
        
        switch (typeOfValue) {
            case "email":
                // set the validation fn to validateEmail
                validationFn = validateEmail;
                break;
            case "username":
                // set the validation fn to validateUsername
                validationFn = validateUsername;
                break;
            case "password":
                // set the validation fn to validatePassword
                validationFn = validatePassword;
                break;
            default:
            	validationFn = () => {return {valid:false, message:"Not recognised typeOfValue"}};
            	break;
        }

        const validate = await validationFn(valueToValidate);
        const currentValueIsValid = validate.valid;
        if(currentValueIsValid === false) {
            // if invalid, update allValid and break from loop.
            message = validate.message;
            allValid = false;
            break;
        }


    }

    
    return {
        allValid, message
    };
}



function executeSQL(sqlCode, sqlParameter, sqlParameterType) {
	if(sqlCode == undefined) {
		console.error("parameter sqlCode was not supplied");
		return;
	}

	return new Promise(async (resolvePromise) => {
        /* request.post({
            url: "https://alpha-howl.com/database/executeSQLNEA.php", 
            body: {
                action: "sql",
                sql: sqlCode,
                sqlParameter,
                sqlParameterType
            }
        }, (error, response, body) => {
            resolvePromise(response);
        }); */       
        
        resolvePromise({result: {rows: []}});
	});
}



async function handleNewAccountCreation(email, username, password, response) {

    const validationResult = await isValid(response, email, "email", username, "username", password, "password");
    if( validationResult.allValid === false ) {
        // if any one of the arguments is invalid, send back 
        // a response with the message of why it is invalid
        // and stop running the function (return)
        response.status(200).send({error: "User input was not valid", message: validationResult.message});
        return;
    }

    response.status(200).send("all valid - may continue");
    // todo - the username, email and password are now all valid.
}
function handleUserLoginAttempt(usernameOrEmail, password, response) {
    // todo
}
function handleUserLogout(usernameOrEmail, response) {
    // todo
}
function handleAccountDeletion(usernameOrEmail, password, response) {
    // todo
}





/* app.use("/", (req, res, next) => {
    
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    /* const body = [];
    req.on("data", (chunk) => {
        body.push(chunk);
    });
    req.on("end", () => {
        const parsedBody = Buffer.concat(body).toString();
        // Now parsedBody will be like a query string: key1=val1&key2=val2
        const queryObject = new URLSearchParams(parsedBody);
        parseRequest(queryObject, res);
        //console.log(parsedBody);
    });
    //console.log(body); */

    //next();
//}); 

app.post("/", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const body = [];
    req.on("data", (chunk) => {
        body.push(chunk);
    });
    req.on("end", () => {
        const parsedBody = Buffer.concat(body).toString();
        //res.status(200).send("bod" + parsedBody);
        // Now parsedBody will be like a query string: key1=val1&key2=val2
        const queryObject = new URLSearchParams(parsedBody);
        parseRequest(queryObject, res);
        //console.log(parsedBody);
    });
    //console.log(body);

    next();
});












app.listen(process.env.PORT || 3000);
