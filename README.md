
# **MaeshBot 🎶**
This application was created for usage on Discord. The user inputs a playlist extracted from YouTube and the application converts the songs to a Spotify playlist.

## **Getting Started**
These instructions will help you get a copy of the project and set it up for testing and development purposes on your local machines. See notes for extra information. 

### **Development Setup**
Required: Node.js
1. Clone the repository:
	```git clone https://github.com/michvong/maesh-bot.git```
2. Install dependencies:
	```
	npm install
	```
3. Create a .env file containing the following:
	```
	YOUTUBE_TOKEN=[your token here]
	DISCORD_TOKEN=[your token here]
	SPOTIFY_ACCESS_TOKEN=[your token here]
	SPOTIFY_CLIENT_ID=[your token here]
	SPOTIFY_CLIENT_SECRET=[your token here]
	SPOTIFY_REDIRECT_URI=[your token here]
	```
## **Usage**
1. Run the application :
	```
	node index.js
	```
2.  On Discord, type in:
	```
	$convert <link of YouTube playlist>
	```
**Input:**

![Image of input](https://i.gyazo.com/83297317a571b476abebd4701835b935.png)

**Output:**

![Image of output](https://i.gyazo.com/da45bba0b9cf6c3fc0184acd0faf8467.png)


### **Notes**
- The YouTube playlist must be set as public in order to work.

- The application will only support up to 50 songs.

- The application has a bug caused by an Internal Server Error ([Response Status Code 500](https://developer.spotify.com/documentation/web-api/)).  The bug will cause some songs from the YouTube playlist to not get converted into the Spotify playlist.  This bug is random and not consistently reproducable.  There is no information on how to fix this as of yet.

- YouTube songs also may not be found on Spotify due to the difference in music libraries or titles.

- Must provide your own YouTube API Key, Spotify Client ID, Spotify Client Secret, and Spotify API Access Code for this bot to function.

## **Authors**
- **Jordan Fun** - [JordanFun](https://github.com/JordanFun)
- **Clement To** - [glem-toe](https://github.com/glem-toe)
- **Michelle Vong** - [michvong](https://github.com/michvong)
- **Raymond Zou** - [RaymoZoo](https://github.com/raymozoo)

## **Acknowledgments**
We would like to thank the team at nwHacks for supporting us!
