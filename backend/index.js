require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const app = express();

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const fileManager = new GoogleAIFileManager(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Gemini model for processing
});

// Middleware
app.use(cors({
  origin: 'https://swipe-fullstack-intern-assignmentfrontend-7ea0to6i9.vercel.app/', 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup using Multer
const upload = multer({ dest: "uploads/" });

// Route: File Upload and Process
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const mimeType = file.mimetype;
    const displayName = file.originalname;

    // Upload file to Gemini
    const uploadResponse = await fileManager.uploadFile(file.path, {
      mimeType,
      displayName,
    });

    // Generate content and process the file
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        },
      },
      { text: " You are a specialist in comprehending receipts and documents. You will receive input files in the form of images, PDFs, or Excel files. Your task is to accurately extract and organize details related to invoices, products, and customers from these files in a structured format, such as JSON, with appropriate tags for each data field." },
    ]);

    console.log("Gemini API Response:", result.response.text());
    
    // Parse response and send structured data
    const extractedData = parseGeminiResponse(result.response.text());
    res.json({
      status: "success",
      invoices: extractedData.invoices,
      products: extractedData.products,
      customers: extractedData.customers,
    });

    // Cleanup temporary file
    require("fs").unlinkSync(file.path);
  } catch (error) {
    console.error("Error processing file:", error.message);
    res.status(500).json({ error: "Failed to process file." });
  }
});


// Clean the response to remove non-JSON content and ensure valid JSON formatting
function cleanResponse(response) {
  // Find the first '{' and the last '}'
  const jsonStartIndex = response.indexOf('{');
  const jsonEndIndex = response.lastIndexOf('}');

  if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
    // Extract the potential JSON content
    let cleanedResponse = response.substring(jsonStartIndex, jsonEndIndex + 1);

    // Step 1: Replace single quotes with double quotes for property names and values
    cleanedResponse = cleanedResponse.replace(/'([^']+)'(?=:)/g, '"$1"'); // Replace 'key' with "key"
    cleanedResponse = cleanedResponse.replace(/'([^']+)'/g, '"$1"'); // Replace 'value' with "value"

    // Step 2: Remove trailing commas
    cleanedResponse = cleanedResponse.replace(/,\s*}/g, '}'); // Remove trailing commas in objects
    cleanedResponse = cleanedResponse.replace(/,\s*]/g, ']'); // Remove trailing commas in arrays

    // Step 3: Remove unwanted whitespace and newline characters
    cleanedResponse = cleanedResponse.replace(/(\r\n|\n|\r)/gm, ''); // Remove newlines
    cleanedResponse = cleanedResponse.trim(); // Trim spaces

    return cleanedResponse;
  }

  return "{}"; // Return an empty JSON object if the input doesn't seem valid
}




function parseGeminiResponse(text) {
  try {
    const cleanedResponse = cleanResponse(text);
    const data = JSON.parse(cleanedResponse);

    // Initialize arrays for customers, invoices, and products
    const invoices = [];
    const products = [];
    const customers = [];

    // Extract invoices - Adjust for the correct structure
    if (data.invoice_number && data.items) {
      const invoice = {
        serial: data.invoice_number || "N/A",
        customer: data.customer?.name || "Unknown",  // Safely access customer name
        product: "",  // Will be filled in per item
        qty: 0,  // Will be filled in per item
        tax: 0,  // Will be filled in per item
        total: data.total?.amount || 0, // Adjust field name if necessary
        date: data.invoice_date || "N/A",
      };

      // Loop through items to populate product, qty, and tax for invoice
      data.items.forEach(item => {
        invoice.product = item.description || "N/A";
        invoice.qty = item.quantity || 0;
        invoice.tax = item.gst || 0;
        invoices.push({ ...invoice });  // Clone and push the invoice for each item
      });
    }

    // Extract product data
    if (data.items) {
      data.items.forEach(item => {
        const product = {
          name: item.description || "N/A",
          qty: item.quantity || 0,
          unitPrice: item.rate || 0,
          tax: item.gst || 0,
          priceWithTax: item.amount || 0,
        };
        products.push(product);
      });
    }

    // Extract customer data
    if (data.customer) {
      const customer = {
        name: data.customer.name || "Unknown",
        qty: 0, // Aggregate quantities from items
        unitPrice: 0, // Representative rate from items
        tax: 0, // Aggregate tax
        priceWithTax: 0, // Aggregate priceWithTax
      };

      // Aggregate quantity, unit price, tax, and priceWithTax per customer
      if (data.items) {
        data.items.forEach(item => {
          customer.qty += item.quantity || 0;
          customer.unitPrice = item.rate || 0;  // Assuming unitPrice from the first item
          customer.tax += item.gst || 0;
          customer.priceWithTax += item.amount || 0;
        });
      }
      customers.push(customer);
    }

    return { invoices, products, customers };

  } catch (error) {
    console.error("Error parsing response:", error.message);
    return { invoices: [], products: [], customers: [] };
  }
}









module.exports = app;
