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

	const handleFileChange = (event) => {
		const selectedFile = event.target.files[0];
		setFile(selectedFile);
	};

	const handleApiKeyChange = (event) => {
		setApiKey(event.target.value);
		setIsInputValid(true);
	};

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
	
	useEffect(() => {
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
