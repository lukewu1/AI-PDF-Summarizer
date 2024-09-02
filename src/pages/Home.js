import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';
import Cookies from 'js-cookie';
import Main from '../components/Main.js';
import { Client } from '@notionhq/client';
import '../styles/Home.css';

export default function Home() {
	const [file, setFile] = useState(null);
	const [apiKey, setApiKey] = useState(Cookies.get('apiKey') || '');
	const [isValidApiKey, setIsValidApiKey] = useState(false);
	const [isInputValid, setIsInputValid] = useState(true);
	// const [apiKeyNotion, setApiKeyNotion] = useState(Cookies.get('apiKeyNotion') || '');
	// const [isValidApiKeyNotion, setIsValidApiKeyNotion] = useState(false);
	// const [isInputValidNotion, setIsInputValidNotion] = useState(true);
	// const [notionPageId, setNotionPageId] = useState(Cookies.get('notionPageId') || '');

	const handleFileChange = (event) => {
		const selectedFile = event.target.files[0];
		setFile(selectedFile);
	};

	const handleApiKeyChange = (event) => {
		setApiKey(event.target.value);
		setIsInputValid(true);
	};

	// const handleApiKeyNotionChange = (event) => {
	// 	setApiKeyNotion(event.target.value);
	// 	setIsInputValidNotion(true);
	// 	console.log("Notion API Key changed:", event.target.value);
	// };

	// const handlePageIdChange = (event) => {
	// 	setNotionPageId(event.target.value);
	// 	console.log("Notion Page ID changed:", event.target.value);
	// };

	const checkApiKey = async () => {
		const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });
		try {
			await openai.models.list();
			setIsValidApiKey(true);
			Cookies.set('apiKey', apiKey);
			return true;
		} catch (error) {
			setIsValidApiKey(false);
			setIsInputValid(false);
			return false;
		}
	}

	// const checkApiKeyNotion = async () => {
	// 	try {
	// 		const notion = new Client({ auth: apiKeyNotion });
	// 		// Attempt to retrieve a simple resource to verify the API key
	// 		const response = await notion.databases.list();
			
	// 		// If the response is successful
	// 		if (response) {
	// 			setIsValidApiKeyNotion(true);
	// 			Cookies.set('apiKeyNotion', apiKeyNotion);
	// 			console.log('Notion API key is valid');
	// 		} else {
	// 			setIsValidApiKeyNotion(false);
	// 			setIsInputValidNotion(false);
	// 			console.error('Invalid Notion API key');
	// 		}
	// 	} catch (error) {
	// 		setIsValidApiKeyNotion(false);
	// 		setIsInputValidNotion(false);
	// 		console.error('Invalid Notion API key:', error);
	// 	}
	// };

	// const checkApiKeyNotion = async () => {
	// 	try {
	// 		const response = await fetch('http://localhost:3001/notion/databases', {
	// 			method: 'GET',
	// 			headers: {
	// 				'Authorization': `Bearer ${apiKeyNotion}`, // Send the API key to your proxy server
	// 			},
	// 		});
	
	// 		if (response.ok) {
	// 			setIsValidApiKeyNotion(true);
	// 			Cookies.set('apiKeyNotion', apiKeyNotion);
	// 			console.log('Notion API key is valid');
	// 		} else {
	// 			setIsValidApiKeyNotion(false);
	// 			setIsInputValidNotion(false);
	// 			console.error('Invalid Notion API key');
	// 		}
	// 	} catch (error) {
	// 		setIsValidApiKeyNotion(false);
	// 		setIsInputValidNotion(false);
	// 		console.error('Invalid Notion API key:', error);
	// 	}
	// };
	
	
	useEffect(() => {
		// Check if the OpenAI API key is valid
		if (apiKey && !isValidApiKey) {
			checkApiKey();
		}
	}, [apiKey, checkApiKey, isValidApiKey]);

	return (
		<div id='content'>
			<h1>AI PDF summariser</h1>
			{isValidApiKey ? (
				<>
					<div className='APIKey'>
						<button id="hoverable" onClick={() => {
							setIsValidApiKey(false);
							setApiKey('');
							Cookies.remove('apiKey');
						}}>Change API key</button>
					</div>
					<div className='upload'>
						<h3>Upload PDF file</h3>
						<div className='block'>
							<input type="file" onChange={handleFileChange} />
						</div>
					</div>
					<div className='PDFViewer'>
						{file && <Main file={file} />}
					</div>
				</>
			) : (
				<div className="APIKey">
					<h3>Enter your OpenAI API key</h3>
					<button 
						id="hoverable"
						onClick={() => window.open("https://www.howtogeek.com/885918/how-to-get-an-openai-api-key/")}>
						How to get an API Key
					</button>
					<div className="APIKey-form">
						<input
							className={isInputValid ? "" : "invalid"}
							type="text"
							value={apiKey}
							onChange={handleApiKeyChange}
							placeholder="Enter your API key"
							id="hoverable"
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									checkApiKey();
								}
							}}
						/>
						<button
							id="hoverable"
							onClick={() => {
								checkApiKey();
							}}
						>Enter</button>
						{!isInputValid && <p className="error">Invalid API key</p>}
					</div>
				</div>
			)}
		</div>
	);
}
