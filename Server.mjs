import express from 'express';
import { Client } from '@notionhq/client';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize the Notion client with your API key
// const notion = new Client({
//     // auth: "secret_QDNAUgKPoGyXM2PSVHnHUoevz8H1QPLJN9cPDg7KsG6" // Replace with your actual Notion API key
// });

// Helper function to split content into chunks
function splitContentIntoChunks(content, chunkSize = 2000) {
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.substring(i, i + chunkSize));
    }
    return chunks;
}

// Endpoint to update the content of a page based on a filter
app.post('/update-page-content', async (req, res) => {
    const apiKeyNotion = req.headers['authorization']?.replace('Bearer ', '').trim();
    console.log("apikeynotion: ", apiKeyNotion);
    const { databaseId, searchString, newText } = req.body;

    if (!apiKeyNotion) {
        return res.status(400).json({ error: 'Notion API key is missing' });
    }

    const notion = new Client({ auth: apiKeyNotion });

    try {
        // Query the Notion database to find the page containing the specified text
        const queryResponse = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'Chapter Notes', // Assuming 'Name' is the property you're searching on
                rich_text: {
                    contains: searchString,
                },
            },
        });

        if (queryResponse.results.length > 0) {
            const pageId = queryResponse.results[0].id;

            // Retrieve the existing content of the 'Text' property
            const page = await notion.pages.retrieve({ page_id: pageId });
            const currentContent = page.properties.Text.rich_text.map(rt => rt.text.content).join("\n");

            // Append the new content to the existing content
            const updatedContent = `${currentContent}\n\n${newText}`;

            // Split the updated content into chunks of 2000 characters or less
            const contentChunks = splitContentIntoChunks(updatedContent);

            // Create rich_text blocks for each chunk
            const richTextBlocks = contentChunks.map(chunk => ({
                text: {
                    content: chunk,
                },
            }));

            // Update the page with the new content
            const updateResponse = await notion.pages.update({
                page_id: pageId,
                properties: {
                    Text: {
                        rich_text: richTextBlocks,
                    },
                },
            });

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

app.post('/check-notion-key', async (req, res) => {
    const { apiKeyNotion } = req.body;
    try {
        const response = await fetch('https://api.notion.com/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKeyNotion}`,
                'Notion-Version': '2022-06-28',
            },
        });

        if (response.ok) {
            const userData = await response.json(); // Fetch the user data to confirm the key is valid
            res.json({ message: 'Notion API key is valid', user: userData });
        } else {
            res.status(401).json({ error: 'Invalid Notion API key' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to validate Notion API key' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
