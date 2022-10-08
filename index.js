const BASE_URL = "https://api.socialimage.app/v1";
const DEFAULT_API_KEY = "";
const DEFAULT_TEMPLATE_ID = "";
/**
 * Run once the Googlesheet has been opened */
const onOpen = () => {
  let spreadsheet = SpreadsheetApp.getActive();
  let menuItems = [{ name: "Generate Images", functionName: "generateImages" }];
  spreadsheet.addMenu("Social Image", menuItems);
};
/**
 * Generate the images.
 * @returns
 */
const generateImages = () => {
  // Get your Project API Key
  let API_KEY =
    DEFAULT_API_KEY !== ""
      ? DEFAULT_API_KEY
      : Browser.inputBox(
          "Social Image API Key",
          "Please enter your Social Image Project API Key",
          Browser.Buttons.OK
        );
  // Check the API key is valid.
  checkAuthentication(API_KEY);
  let sheet = SpreadsheetApp.getActiveSheet();
  let sheetData = "";
  let socialImageUrlColIndex = "";
  let socialImageModifications = [];
  let templateCols = [];
  try {
    sheetData = sheet.getDataRange().getValues();
    socialImageModifications = [];
    socialImageUrlColIndex = sheetData[0].indexOf("socialImageUrl");
    for (let col of sheetData[0]) {
      if (col.indexOf("socialImageUrl:") > -1) {
        templateCols.push({
          index: sheetData[0].indexOf(col),
          templateId: col.split("socialImageUrl:")[1],
        });
      }
    }
    if (templateCols.length === 0) {
      if (sheetData[0].indexOf("socialImageUrl")) {
        templateCols.push({
          index: sheetData[0].indexOf("socialImageUrl"),
        });
        // Get the Template Id to use.
        let templateId =
          DEFAULT_TEMPLATE_ID !== ""
            ? DEFAULT_TEMPLATE_ID
            : Browser.inputBox(
                "Social Image Template Id",
                "Please enter the Social Image Template Id for the template you wish to use.",
                Browser.Buttons.OK
              );
        templateCols[0]["templateId"] = templateId;
      }
    }
    // Check that the image output column exists
    if (templateCols.length === 0) {
      Browser.msgBox(
        "Missing image output column",
        "Please add a column named 'socialImageUrl' to get your generated image URLs",
        Browser.Buttons.OK
      );
      return;
    }

    let firstRow = sheetData[0];
    for (let columnIndex = 0; columnIndex < firstRow.length; columnIndex++) {
      let columnName = sheetData[0][columnIndex];
      let columnCheck = columnName.startsWith("socialImage.");
      let isImageCol = columnName === "socialImage.image";
      if (columnCheck && !isImageCol) {
        let modification = {
          columnIndex: columnIndex,
          name: columnName,
        };
        socialImageModifications.push(modification);
      }
    }
  } catch (e) {
    console.log(e);
    Browser.msgBox(
      "Google Sheet is invalid.",
      "Please check the format of your Google Sheet.",
      Browser.Buttons.OK
    );
    return;
  }
  Browser.msgBox(
    "Image Generation is starting...",
    "The generation of your images may take a while. Please DO NOT edit or close the spreadsheet whilst your images are being generated.",
    Browser.Buttons.OK
  );
  let socialImageUrlCell = "";
  console.log("templateCols:", templateCols);
  for (let rowIndex = 1; rowIndex < sheetData.length; rowIndex++) {
    for (let templateCol of templateCols) {
      try {
        let row = sheetData[rowIndex];
        let modifications = [];
        for (let element of socialImageModifications) {
          let columnIndex = element.columnIndex;
          let name = element.name;
          let value = row[columnIndex];
          let property = name.replace("socialImage.", "");
          let modName = property.split(".")[0];
          let modProp = property.split(".")[1];
          let newModification = {
            name: modName,
            [modProp]: value,
          };
          modifications.push(newModification);
        }
        socialImageUrlCell = sheet.getRange(
          rowIndex + 1,
          templateCol.index + 1
        );
        console.log(socialImageUrlCell);
        socialImageUrlCell.setValue("Generating...");
        let imageUrl = generateImage(
          templateCol.templateId,
          modifications,
          API_KEY
        );
        console.log("Image Generated:", imageUrl);
        socialImageUrlCell.setValue(imageUrl);
      } catch (e) {
        console.log(e);
        if (socialImageUrlCell) {
          socialImageUrlCell.setValue("Error: " + e);
        }
      }
    }
  }
  Browser.msgBox(
    "Done!",
    "Social Image has finished generating your images.",
    Browser.Buttons.OK
  );
};

/**
 * Check that the API key is valid.
 * @param {String} API_KEY
 * @returns
 */
function checkAuthentication(API_KEY) {
  try {
    // Request object.
    let responseBody = authenticatedRequest(
      "/authenticate",
      API_KEY,
      {},
      "get"
    );
    return responseBody.message;
  } catch (e) {
    Browser.msgBox(
      "API Key Invalid",
      "Please check that your API key is correct. View https://www.socialimage.app/en/help/api/how-do-i-get-an-api-key for more info.",
      Browser.Buttons.OK
    );
    return;
  }
}
/**
 * Make an authenticated request to the API endpoint.
 * @param {String} url The endpoint URL.
 * @param {String} API_KEY The API key to use.
 * @param {Object} additionalOptions Any additional options.
 * @param {String} method The request method.
 */
const authenticatedRequest = (
  endpoint,
  API_KEY,
  additionalOptions = {},
  method = "post"
) => {
  let options = {
    method: method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    contentType: "application/json; charset=utf-8",
    ...additionalOptions,
  };
  let response = UrlFetchApp.fetch(BASE_URL + endpoint, options);
  let json = response.getContentText();
  let responseBody = JSON.parse(json);
  return responseBody;
};
/**
 * Generate a singular image.
 * @param {String} templateId The id of the template to use.
 * @param {Array} modifications An array of modifications
 * @param {String} API_KEY The project API Key you want to use.
 * @returns
 */
function generateImage(templateId, modifications, API_KEY) {
  let payload = {
    template: templateId,
    modifications: modifications,
  };
  console.log("Payload:", payload);
  let responseBody = authenticatedRequest(
    "/generate",
    API_KEY,
    {
      payload: JSON.stringify(payload),
    },
    "post"
  );
  return responseBody.url;
}
