import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { load } from "cheerio";
import puppeteer from "puppeteer";
/* -------------------------------------------------------------------------- */
/*                                BASIC CONFIG                                */
/* -------------------------------------------------------------------------- */
const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());

/* -------------------------------------------------------------------------- */
/*                                OPENAI CONFIG                               */
/* -------------------------------------------------------------------------- */

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/* -------------------------------------------------------------------------- */
/*                                EXPRESS CONFIG                              */
/* -------------------------------------------------------------------------- */

app.post("/", async (req, res) => {
  const { url } = req.body;
  console.log(url);
  const targetUrl = url;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(targetUrl);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  const searchResultSelector = ".show-more-less-html__markup";
  const details = await page.waitForSelector(searchResultSelector);
  const fullDetails = await details.evaluate((el) => el.textContent);

  await browser.close();

  await openai
    .createCompletion({
      model: "text-davinci-003",
      prompt: `Adapt your language to the job offer. Write a cover letter for this job offer :\n ${fullDetails}`,
      max_tokens: 1000,
      temperature: 0,
    })
    .then((response) => {
      res.json({
        message: response.data.choices[0].text,
      });
    })
    .catch((err) => {
      res.json({ message: err.message });
    });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
