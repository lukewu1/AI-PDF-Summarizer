import express from 'express';
import { Client } from '@notionhq/client';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize the Notion client with your API key
const notion = new Client({
    auth: "secret_QDNAUgKPoGyXM2PSVHnHUoevz8H1QPLJN9cPDg7KsG6" // Replace with your actual Notion API key
});

app.get('/check-notion-key', async (req, res) => {
    const notionApiKey = req.headers['authorization'];
    try {
        const response = await fetch('https://api.notion.com/v1/databases', {
            method: 'GET',
            headers: {
                'Authorization': notionApiKey,
                'Notion-Version': '2022-06-28',
            },
        });

        if (response.ok) {
            res.json({ message: 'Notion API key is valid' });
        } else {
            res.status(401).json({ error: 'Invalid Notion API key' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to validate Notion API key' });
    }
});

// Endpoint to update the content of a page based on a filter
app.post('/update-page-content', async (req, res) => {
    const { databaseId, searchString, newText } = req.body;

    try {
        // Query the Notion database to find the page containing the specified text
        const queryResponse = await notion.databases.query({
            database_id: databaseId, // ID of the database to search within
            filter: {
                property: 'Name', // Assuming 'Name' is the property you're searching on
                rich_text: {
                    contains: searchString, // The text to search for
                },
            },
        });

        if (queryResponse.results.length > 0) {
            const pageId = queryResponse.results[0].id;

            // Update the content of the 'Text' property on the found page
            const updateResponse = await notion.pages.update({
                page_id: pageId,
                properties: {
                    Text: {
                        rich_text: [
                            {
                                text: {
                                    content: newText, // The new text to set
                                },
                            },
                        ],
                    },
                },
            });

            console.log(newText)

            res.json({
                message: 'Page updated successfully',
                updateResponse
            });
        } else {
            res.status(404).json({ error: 'No pages found with the specified text.' });
        }
    } catch (error) {
        console.error("Error updating the page:", error);
        res.status(500).json({ error: 'An error occurred while updating the page.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
