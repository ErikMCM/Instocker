//Required Packages
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const chalk = require('chalk');

//System Packages
const fs = require('fs');
const os = require('os');
const tmp = os.tmpdir();

//Configuration (Global Variables)
const config = JSON.parse(fs.readFileSync('./config/config.json'));

const url = config.url;

//Settings - DO NOT EDIT THESE
const settings = JSON.parse(fs.readFileSync('./config/settings.json'));

const outOfStockElementClass = settings.outOfStockElementClass;
const inStockElementClass = settings.inStockElementClass;


//Function to email once its in stock
function email() {
    //Login to gmail account
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.gmailAddress,
            pass: config.gmailPassword
        }
    });

    //All the info regarding this email
    var mailOptions = {
        headers: {
            priority: 'high'
        },
        from: config.gmailAddress,
        to: config.recipientEmailAddress,
        subject: config.emailSubject,
        text: config.emailContent
    };

    //Send email
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(chalk.red(`[${run} - ${new Date().toLocaleString()}]: ` + "EMAIL ERROR:\n\n" + error));
        } else {
            console.log(chalk.green(`[${run} - ${new Date().toLocaleString()}]: ` + 'EMAIL SENT:\n\n' + info.response));
        };
    });
};

//Variables for later
let browser;
let page;
let run = 0;

//Launch Browser
async function main() {
    //If its the first ever time running
    if (run == 0) {
        console.log(chalk.yellow(`[${run} - ${new Date().toLocaleString()}]: ` + "Launching Chromium..."));
        
        //Download chromium and assign the executable to "browser"
        browser = await puppeteer.launch();

        console.log(chalk.yellow(`[${run} - ${new Date().toLocaleString()}]: ` + "Creating Page..."))


        //Create the page
        page = await browser.newPage();

        //Dont stop loading the page if the connection is slow
        await page.setDefaultNavigationTimeout(0);

        console.log(chalk.yellow(`[${run} - ${new Date().toLocaleString()}]: ` + "Setting User Agent..."))

        //Set the user agent so the site knows what type of format to return
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.52 Safari/537.36')


        console.log(chalk.yellow(`[${run} - ${new Date().toLocaleString()}]: ` + "Going to Site..."))

        //Go to website
        await page.goto(url, { waitUntil: 'domcontentloaded' });

    } else if (run > 0) { //This isnt the first run, so we've already downloaded chromium and have gone to the site
        console.log(chalk.yellow(`[${run} - ${new Date().toLocaleString()}]: ` + "Reloading Site..."));

        //Reload/Refresh the site
        await page.reload({timeout: 0, waitUntil: "domcontentloaded"});
    };
    

    console.log(chalk.yellow(`[${run} - ${new Date().toLocaleString()}]: ` + "Checking Site..."));

    //Check if the raw HTML content has the out of stock element class
    if ((await page.content()).includes(outOfStockElementClass)) {
        //Log that the item is out of stock
        console.log(chalk.red(`[${run} - ${new Date().toLocaleString()}]: ` + 'Out of Stock.'));

    } else if ((await page.content()).includes(inStockElementClass)) { //If the raw HTML content has the in stock element class
        //Start Sending the Email
        email();

        //Log the item is in stock with a big large post
        console.log(chalk.green(`[${run} - ${new Date().toLocaleString()}]: ` + '\n@@@@@@@@@@@@@\n*************\n\nIn Stock!\n\n' + url + '\n\n*************\n@@@@@@@@@@@@@'));
    } else { //How did we get here??
        //If this happens relaunch the program
        console.log(`[${run} - ${new Date().toLocaleString()}]: ` + '???????\n\nThere was an unknown error, if this re-occours re-launch the program.');
    };

    //Increase the cycle count by one
    run += 1;

    return;
}

//Run the function the first time the application boots up
main();

//Run the application for the specified amount of seconds
setInterval(main, config.timeout * 1000);