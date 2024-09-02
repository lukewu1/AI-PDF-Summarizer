import React, { useState, useEffect } from "react";
import MarkdownRender from '../utils/MarkdownRender.js';

export default function Message(props){ 
    const [textContent, setTextContent] = useState("");
    const [completed, setCompleted] = useState(false); // so that it doesn't fetch completions more than once

    const config = {
        loader: { load: ['input/asciimath', 'output/chtml'] },
        asciimath: { delimiters: [["$$", "$$"]] },
        tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] }
    };

    // console.log("Message props", props);

    const adaptLatex = (text) => {
        // convert \[ \] to $$ $$ and \( \) to $ $
        let newText = text;
        newText = newText.replaceAll("\\[", "$$");
        newText = newText.replaceAll("\\]", "$$");
        newText = newText.replaceAll("\\(", "$");
        newText = newText.replaceAll("\\)", "$");
        return newText;
    }

    // Function to send the generated message to Notion
    // const sendToNotion = async (messageContent) => {
    //     apiKeyNotion = "secret_QDNAUgKPoGyXM2PSVHnHUoevz8H1QPLJN9cPDg7KsG6"
    //     try {
    //         const response = await fetch(`http://localhost:3001/update-page-content`, { // This hits your backend server
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${apiKeyNotion}`, // Include API key here
    //             },
    //             body: JSON.stringify({
    //                 databaseId: 'defbd45c536b44508b16321564f91445', // Replace with your actual database ID
    //                 searchString: 'CSCI', // The text to search for in the page title
    //                 newText: messageContent // Content to be added to the Notion page
    //             }),
    //         });
    
    //         const data = await response.json();
    
    //         if (!response.ok) {
    //             console.error('Failed to update content in Notion', data);
    //         } else {
    //             console.log('Content updated in Notion successfully:', data);
    //         }
    //     } catch (error) {
    //         console.error('Error updating content in Notion:', error);
    //     }
    // };

    useEffect(() => {
        const fetchData = async () => {
            if (props.isBot && !completed) {
                setCompleted(true);
                let result = '';

                if (props.stream){
                    for await (const part of props.stream) {
                        const deltaContent = part.choices[0]?.delta?.content || '';
                        result += deltaContent;
                        setTextContent(result);
                        props.scrollToBottom && props.scrollToBottom();
                    }
                } else {
                    result = props.text || "Sorry, there was an unexpected error.";
                    setTextContent(result);
                    props.scrollToBottom && props.scrollToBottom();
                }

                props.setIsGenerating(false);
                props.setOpenaiChatHistory(props.openaiChatHistory.concat({ role: 'assistant', content: result }));
            } else if (!props.isBot && !completed) {
                setTextContent(props.text);
                setCompleted(true);
                props.scrollToBottom && props.scrollToBottom();
            }
            window.MathJax && window.MathJax.typesetPromise();

        };
    
        fetchData().catch(console.error);

    }, [completed, props.isBot, props.text, props.stream, props.setIsGenerating, props.setOpenaiChatHistory, props.scrollToBottom]);

    return (
        <div className={props.isBot? "bot-message-container" : "user-message-container"} >
            <div className={props.isBot? "bot-message" : "user-message"} id = {props.thought? "thought" : "message"}>
                {!props.thought && <div className="author">
                    {props.isBot? "AI ✨" : "User"}
                </div>}
                <MarkdownRender key={props.uniqueKey}>
                    {adaptLatex(textContent)}
                </MarkdownRender>
            </div>
        </div>
    );
}
