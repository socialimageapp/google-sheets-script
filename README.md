# Google Sheets App Script Integration

This integration allows users of Social Image to generate images via rows in a Google Sheet.

## Step 1

Go to your Google sheet. Under "Extensions" click "Apps Script".

Paste in the contents of `index.js` in this repository. Hit save.

## Step 2

Add your header rows that correlate to Social Image template components.

E.g `socialImage.tweet_author_image.url` would be the `url` attribute for the `tweet_author_image` template component (a layer in your template with this name).

## Step 3

Once you've added your attributes to the top row, add the output cell columns. Either name a cell in the first row as `socialImageUrl` or add multiple templates with `socialImageUrl:YOUR_TEMPLATE_ID`.

If you choose to use the `socialImageUrl` value for a first row cell, this will prompt you for your template Id when running the script.

You can "hard-wire" these values in the script by setting the `DEFAULT_TEMPLATE_ID` and `DEFAULT_API_KEY` values at the top of the script. E.g

```js
const BASE_URL = "https://api.socialimage.app/v1";
const DEFAULT_API_KEY = "YOUR_API_KEY_GOES_HERE";
const DEFAULT_TEMPLATE_ID = "YOUR_TEMPLATE_ID_GOES_HERE";
....
```
