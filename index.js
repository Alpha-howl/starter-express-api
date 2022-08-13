const express = require('express')
const app = express()
app.all('/', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    console.log("Just got a request!")
    res.send('Proba')
})
app.listen(process.env.PORT || 3000)