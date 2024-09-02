const { Client } = require('@notionhq/client');

const notion = new Client({ 
    auth: "secret_QDNAUgKPoGyXM2PSVHnHUoevz8H1QPLJN9cPDg7KsG6"
});

(async () => {
    try {
        const queryResponse = await notion.databases.query({
            database_id: "defbd45c536b44508b16321564f91445",
            filter: {
                property: 'Name',
                rich_text: {
                    contains: 'CSCI',
                },
            },
        });

        if (queryResponse.results.length > 0) {
            const pageId = queryResponse.results[0].id;
            console.log("pageId: ", pageId)

            // Update the content of the 'text' property
            const updateResponse = await notion.pages.update({
                page_id: pageId,
                properties: {
                    Text: {
                        rich_text: [
                            {
                                text: {
                                    content: "hi i like bob",
                                },
                            },
                        ],
                    },
                },
            });

            console.log('Page updated successfully:', updateResponse);
        } else {
            console.log('No pages found with the specified text.');
        }
    } catch (error) {
        console.error("Error updating the page:", error);
    }
})();

// (async () => {
//     try {
//         const pageId = '779f3965837d452bbb9a519c31185461';

//         // Retrieve the page to inspect properties
//         const page = await notion.pages.retrieve({ page_id: pageId });

//         console.log('Page properties:', page.properties);
//     } catch (error) {
//         console.error("Error retrieving the page:", error);
//     }
// })();