import React, { useState, useEffect, useRef } from "react";
import Message from './Message.js';
import '../styles/Chat.css';
import GPT from '../utils/GPT.js';
import TextareaAutosize from 'react-textarea-autosize';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faStop, faExclamationCircle, faFileCircleXmark, faFileCircleMinus, faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { makeConsoleLogger } from "@notionhq/client/build/src/logging.js";


export default function Chat(props){

    const [model, setModel] = useState("");

   
    const [pageText, setPageText] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [isGenerating, setIsGenerating] = useState(true);
    const [userMessage, setUserMessage] = useState("");
    const [openaiChatHistory,setOpenaiChatHistory] = useState([]);
    const [usePageText, setUsePageText] = useState("-");
    const [animatingButton, setAnimatingButton] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiKeyNotion, setApiKeyNotion] = useState(Cookies.get('apiKeyNotion') || '');
    const [isValidApiKeyNotion, setIsValidApiKeyNotion] = useState(false);
	const [isInputValidNotion, setIsInputValidNotion] = useState(true);
	const [notionPageId, setNotionPageId] = useState(Cookies.get('notionPageId') || '');
    
    const pageContextCycles = ["-", "+", "x"]; // the possible values for usePageText

    const messageRef = useRef(null); // reference to the message container div. Used to scroll to the bottom of the chat
    const gptUtils = useRef(null); // reference to the GPT object
    const supportedModels = useRef(null); // reference to the supported models for the GPT object

    const handleApiKeyNotionChange = (event) => {
		setApiKeyNotion(event.target.value);
		setIsInputValidNotion(true);
		console.log("Notion API Key changed:", event.target.value);
	};

	const handlePageIdChange = (event) => {
		setNotionPageId(event.target.value);
		console.log("Notion Page ID changed:", event.target.value);
	};

    const checkApiKeyNotion = async () => {
        try {
            const response = await fetch('http://localhost:3001/check-notion-key', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKeyNotion}`,
                },
            });
    
            if (response.ok) {
                setIsValidApiKeyNotion(true);
                Cookies.set('apiKeyNotion', apiKeyNotion);
                console.log('Notion API key is valid');
            } else {
                setIsValidApiKeyNotion(false);
                setIsInputValidNotion(false);
                console.error('Invalid Notion API key');
            }
        } catch (error) {
            setIsValidApiKeyNotion(false);
            setIsInputValidNotion(false);
            console.error('Error checking Notion API key:', error);
        }
    };
    
    
    const sendToNotion = async (messageContent) => {
        try {
            const response = await fetch(`http://localhost:3001/update-page-content`, { // This hits your backend server
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKeyNotion}`, // Include API key here
                },
                body: JSON.stringify({
                    databaseId: 'defbd45c536b44508b16321564f91445', // Replace with your actual database ID
                    searchString: 'CSCI', // The text to search for in the page title
                    newText: messageContent // Content to be added to the Notion page
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                console.error('Failed to update content in Notion', data);
            } else {
                console.log('Content updated in Notion successfully:', data);
            }
        } catch (error) {
            console.error('Error updating content in Notion:', error);
        }
    };
    
    
    useEffect(() => {
        // console.log("useEffect");
        // initialise the GPT object
        gptUtils.current = new GPT(model);
        gptUtils.current.setActivePDF(props.file);
        gptUtils.current.setModel(model);
        supportedModels.current = gptUtils.current.getSupportedModels();
        // if the model is not set, set it to the first supported model.
        (model === "" && setModel(supportedModels.current[0]));   
        setIsGenerating(false);
        setLoading(false);
    }, [props.file, model]);


    /**
     * Scroll to the bottom of the chat
     */
    const scrollToBottom = () => {
        if (messageRef.current) {
            messageRef.current.scrollTop = messageRef.current.scrollHeight;
        }
    };

    /**
     * Generate a summary of the page text
     */
    const handleGenerate = async () => {
        setIsGenerating(true);
        const { message, updatedChatHistory, stream } = await gptUtils.current.generateSummary(pageText);

        setOpenaiChatHistory(openaiChatHistory.concat(updatedChatHistory));

        setChatHistory(chatHistory.concat(<Message
            isBot={true}
            stream={stream}
            text={message}
            openaiChatHistory={openaiChatHistory}
            setOpenaiChatHistory={setOpenaiChatHistory}
            setIsGenerating={setIsGenerating}
            scrollToBottom={scrollToBottom}
            key={chatHistory.length}
            uniqueKey={chatHistory.length}
        />));

        console.log("message: ", message)
        console.log("message: ", updatedChatHistory)
        console.log("message: ", stream)
        
        if (isValidApiKeyNotion && apiKeyNotion && notionPageId) {
            await sendToNotion(message); // Call the function to send the content to Notion
        } else {
            console.warn('Notion API key or Page ID is not valid. Content will not be sent to Notion.');
        }

        setIsGenerating(false);
    };

    /**
     * Add a loading chat box to the chat history
     */
    const addLoadingChatBox = () => {
        setChatHistory(prevChatHistory => prevChatHistory.concat(
            <Message
                isBot={true}
                text="Reading the PDF page"
                scrollToBottom={scrollToBottom}
                key={chatHistory.length}
                uniqueKey={chatHistory.length}
                thought = {true}
            />
        ));
    }

    /**
     * Create a "thought" chat message that says which page is being read by the ai
     * 
     * @param {*} page the page number being read
     */
    const addPageCallChatBox = (page) => {
        setChatHistory(prevChatHistory => prevChatHistory.concat(
            <Message
                isBot={true}
                text={`Reading from page ${page} of the PDF`}
                scrollToBottom={scrollToBottom}
                key={chatHistory.length}
                thought = {true}
            />
        ));
    }

    /**
     * Handle sending a message to the chat
     */
    const handleSendMessage = async () => {
        // TODO: Send message to chat history
        // if there is no chat history, add the pdf page as context

        if (userMessage === "\n") return;

        const userText = userMessage;
    
        setUserMessage("");

        setChatHistory(prevChatHistory => prevChatHistory.concat(
            <Message
                isBot={false}
                text={userText}
                scrollToBottom={scrollToBottom}
                key={chatHistory.length}
            />
        ));

        const pageContext = usePageText !== "x" ? pageText : "";

        setIsGenerating(true);

        const useFunctionCalling = usePageText === "+";

        if (useFunctionCalling) {
            addLoadingChatBox();
        }

        const { message, updatedChatHistory, stream } = await gptUtils.current.fetchChatCompletions(openaiChatHistory, pageContext, props.pageNumber, userText, useFunctionCalling, addPageCallChatBox);

        setOpenaiChatHistory(updatedChatHistory);
    
        setChatHistory(prevChatHistory => prevChatHistory.concat([
            <Message
                isBot={true}
                stream={stream}
                text={message}
                openaiChatHistory={openaiChatHistory}
                setOpenaiChatHistory={setOpenaiChatHistory}
                setIsGenerating={setIsGenerating}
                scrollToBottom={scrollToBottom}
                key={chatHistory.length}
            />
        ]));

        console.log("chathistory: ", updatedChatHistory);
        console.log("openaichathistory: ", openaiChatHistory);

    };

    /**
     * Handle clicking an icon button
     * 
     * @param {*} buttonId the id of the button that was clicked
     */
    const handleIconClick = (buttonId) => {
        setAnimatingButton(buttonId);
        setTimeout(() => setAnimatingButton(null), 300); // Reset after animation duration
    };

    /**
     * Scroll to the bottom of the chat when the page text changes
     */
    useEffect(() => {
        if (props.scrollRef && props.scrollRef.current) {
            props.scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
        setPageText(props.text);

        if (apiKeyNotion && !isValidApiKeyNotion) {
			checkApiKeyNotion();
		}
    }, [props.text, props.scrollRef]);

    /**
     * Shows a loading message while the page is loading
     */
    if (loading) {
        return (
            <div>Loading</div>
        );
    }
        

    return (
        <div className="chat">
            <div className="top-chat-elements">
            <div className='APIKey'>
                <h3>Connect to Notion</h3>
                <input
                    type="text"
                    placeholder="Enter your Notion API key"
                    value={apiKeyNotion}
                    onChange={handleApiKeyNotionChange}
                    id="hoverable"
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            checkApiKeyNotion();
                        }
                    }}
                />
                <input
                    type="text"
                    placeholder="Enter your Notion Page ID"
                    value={notionPageId}
                    onChange={handlePageIdChange}
                    id="hoverable"
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            checkApiKeyNotion();
                        }
                    }}
                />
                <button id="hoverable" onClick={() => {
                    // console.log("Connect to Notion button clicked");
                    // console.log("apiKeyNotion:", apiKeyNotion);
                    // console.log("notionDatabaseId:", notionDatabaseId);
                    if (apiKeyNotion && notionPageId) {
                        Cookies.set('apiKeyNotion', apiKeyNotion);
                        Cookies.set('notionPageId', notionPageId);
                        console.log("apiKeyNotion:", apiKeyNotion);
                        console.log("notionPageId:", notionPageId);
                        setIsValidApiKeyNotion(true);
                        console.log("Notion connected successfully");
                    } else {
                        console.log("Notion API key or Page ID missing");
                    }
                    // Cookies.set('apiKeyNotion', apiKeyNotion);
                    // Cookies.set('notionPageId', notionPageId);
                    setIsValidApiKeyNotion(true);
                }}>Connect to Notion</button>
            </div>
                <button
                    className="generate"
                    id="hoverable"
                    disabled={!props.text || isGenerating}
                    onClick={handleGenerate}
                >
                    Summarize
                </button>
            </div>
            <div className="messages" ref={messageRef}>
                {chatHistory.map((message, index) => (
                    <div key={index}>
                        {message}
                    </div>
                ))}

            </div>
            <div className="chat-elements">
                <TextareaAutosize
                    id="userMessageTextarea"
                    placeholder="Ask about content"
                    value={userMessage}
                    onChange={(event) => setUserMessage(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey && userMessage) {
                            event.preventDefault(); // Prevents the default action of Enter key
                            handleSendMessage();
                        }
                    }}
                    disabled={!props.text || isGenerating}
                    style={{ resize: 'none', overflow: 'hidden' }} // Inline CSS to prevent resizing and hide overflow
                />

                <button
                    disabled={!props.text || isGenerating}
                    onClick={() => {
                        handleIconClick('context');
                        setUsePageText(pageContextCycles[(pageContextCycles.indexOf(usePageText) + 1) % 3]);
                    }}
                    title={usePageText === "-" ? "Use page text as context" : usePageText === "+" ? "Use multiple pages as context" : "Do not use page text as context"}
                >
                    <FontAwesomeIcon 
                        icon={usePageText === "-" ? faFileCircleMinus : usePageText === "+" ? faFileCirclePlus : faFileCircleXmark} 
                        className={animatingButton === 'context' ? 'pulse-animation' : ''}
                    />
                </button>
                <button
                    disabled={!props.text || isGenerating || !userMessage}
                    onClick={() => {
                        handleIconClick('send');
                        handleSendMessage();
                    }}
                    title="Send message"
                >
                    <FontAwesomeIcon icon={faPaperPlane} className={animatingButton === 'send' ? 'pulse-animation' : ''} />
                </button>
                <button
                    disabled={chatHistory.length === 0}
                    onClick={() => {
                        handleIconClick('clear');
                        setChatHistory([]);
                        setOpenaiChatHistory([]);
                        setIsGenerating(false);
                    }}
                    title = {isGenerating? "Stop generating" : "Clear chat"}
                >
                    <FontAwesomeIcon icon={isGenerating? faStop : faTrash} className={animatingButton === 'clear' ? 'pulse-animation' : ''} />
                </button>
            </div>
            <div className="additional-chat-elements">
                <select
                    className="mode-selector"
                    value={model}
                    onChange={(event) => {
                        setModel(event.target.value);
                        gptUtils.current.setModel(event.target.value);
                        console.log(event.target.value);
                    }}
                >
                    {supportedModels.current.map((model) => (
                        <option key={model} value={model}>
                            {model}
                        </option>
                    ))}
                </select>
                <div className="alert">
                    {(model === "gpt-4-1106-preview" || model === "gpt-4") && (
                        <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />
                    )}
                    {model === "gpt-4-1106-preview" && " certain features may not work with the selected model"}
                    {model === "gpt-4" && " while smarter, the usage cost for this model is expensive. use with caution"}
                </div>
            </div>
        </div>
    );
}