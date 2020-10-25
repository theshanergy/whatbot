## About The Project

This is a basic chat bot for WhatsApp which uses the OpenAI API (GPT-3). It is written in JavaScript using Node.js.


### Prerequisites

* npm
```sh
npm install npm@latest -g
```
* API keys from OpenAI at https://openai.com.


### Installation

1. Clone the repo
```sh
git clone https://github.com/theshanergy/whatbot.git
```
2. Install NPM packages
```sh
npm install
```
3. Create an .env file containing your API keys as follows:
```sh
OPENAI_KEY="<Publishable key>"
OPENAI_SECRET_KEY="<Secret key>"
```


## Usage

1. Run the bot:
```sh
npm run start
```
2. Open WhatsApp on your phone, select 'WhatsApp Web' from the settings menu, then scan the provided QR code.
3. Choose from the list of recent chats which you would like to activate the bot for. Use space key to select.
4. Sit back and watch the bot respond automatically to incoming messages from your selected contacts.