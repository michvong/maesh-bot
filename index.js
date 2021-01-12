const Discord = require('discord.js');
const { google } = require('googleapis');
const Spotify = require('spotify-web-api-node');

const bot = new Discord.Client();

const prefix = '$';

require('dotenv').config();

var titles = []; // titles of the youtube videos/spotify tracks
var searching = false; // true if the bot is waiting for an answer from the user about searching

bot.login(process.env.DISCORD_TOKEN);

bot.on('ready', () => {
    console.log('Logged in as ' + bot.user.tag);
});

let spotifyApi;
if (
    process.env.SPOTIFY_CLIENT_ID 
    && process.env.SPOTIFY_CLIENT_SECRET
    && process.env.SPOTIFY_REDIRECT_URI 
) {
    spotifyApi = new Spotify({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });
} else {
    spotifyApi = new Spotify();
}

// access token needs to refreshed
spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);

// returns youtube playlistID from a youtube playlist link
function getYouTubePlaylistID(link) {
    var id;
    var indexEndOfID = link.indexOf("&", link.search("list=") + 5);
    if (indexEndOfID != -1) {
        id = link.slice(((link.search("list=")) + 5), indexEndOfID);
    } else {
        id = link.slice((link.search("list=")) + 5);
    }
    //console.log(id);
    return id;
}

// returns spotify playlistID from a spotify playlist link
function getSpotifyPlaylistID(link) {
    var id;
    var indexEndOfID = link.indexOf("?", link.search("playlist") + 9);
    if (indexEndOfID != -1) {
        id = link.slice(link.search("playlist") + 9, indexEndOfID);
    } else {
        id = link.slice(link.search("playlist") + 9);
    }
    //console.log(id);
    return id;
}

// returns true if link is a youtube link
function isYouTubePlaylist(link) {
    var indexStart = link.indexOf(".");
    var website = link.substring(indexStart + 1, indexStart + 8);
    //console.log(website == "youtube");
    return website == "youtube";
}

// returns true if link is a spotify link
function isSpotifyPlaylist(link) {
    var indexStart = link.indexOf(".");
    var website = link.substring(indexStart + 1, indexStart + 8);
    //console.log(website == "spotify");
    return website == "spotify";
}

// converts a playlist from youtube to spotify
// playlistID is the playlist id of the youtube playlist
function convertYouTubePlaylist(playlistID, message) {
    google.youtube('v3').playlistItems.list({
        key: process.env.YOUTUBE_TOKEN,
        part: 'snippet',
        playlistId: playlistID,
        maxResults: 50,
    }).then((response) => {
        const { data } = response;
        data.items.forEach((item) => {
            var title = item.snippet.title;
            title = title.replace(/f(ea)?t.|Lyrics|((Official )?(Lyric )?(Music )?(Video|Audio))|MV|M\/V/gi, ' ');
            var newTitle = "";
            for (i = 0; i < title.length; i++) {
                var currChar = title.charAt(i);
                var letterNumber = /^[0-9a-zA-Z]+$/;
                if (letterNumber.test(String(currChar))) {
                    newTitle = newTitle.concat("", String(currChar));
                } else {
                    newTitle = newTitle.concat("", " ");
                }
            }
            titles.push(newTitle);
            //message.channel.send(newTitle);
            //console.log(newTitle);
        })
        createSpotifyPlaylist(message);
        

    }).catch((err) => console.log(err));
}

// creates a new playlist and calls searchAndAdd()
function createSpotifyPlaylist(message) {
    spotifyApi.createPlaylist('MaeshBot\'s Playlist', { 'description': 'Playlist converted from YouTube by MaeshBot :)', 'public': true })
        .then(function (data) {
            var spotifyPlaylistId = data.body.id;
            titles.forEach((title) => {
                // search for title
                searchAndAdd(title, spotifyPlaylistId);
                // add first track to playlist
            })
            message.channel.send("Here's the link to the playlist: " + String(data.body.external_urls.spotify));
            console.log('Created playlist!', data.body);
        }, function (err) {
            console.log('Something went wrong!', err);
        });
}

// searches for tracks with title and adds the first result to playlistToAdd
// title is a stripped title of a YouTube video
// playlistToAdd is a Spotify playlistId
function searchAndAdd(title, playlistToAdd) {
    spotifyApi.searchTracks(title)
        .then(function (data) {
            var firstTrack = data.body.tracks.items[0].id;
            addToPlaylist(firstTrack, playlistToAdd);
            console.log('Searched for track', data.body);
        }, function (err) {
            console.log('Something went wrong!', err);
        });
}

// adds a track to a playlist
// trackId is a Spotify track ID
// playlist is a Spotify playlist ID
function addToPlaylist(trackId, playlist) {
    spotifyApi.addTracksToPlaylist(playlist, [`spotify:track:${trackId}`])
        .then(function (data) {
            console.log('Added tracks to playlist!');
        }, function (err) {
            console.log('Something went wrong!', err);
        });
}

// adds each "[Artist] - [Track Name]" to titles
// asks the user which song they would like to search for specifically
// sets searching to true as it is awaiting a user response
function searchSpotifyPlaylist(playlistID, message) {
    spotifyApi.getPlaylist(playlistID)
        .then(function (data) {
            data.body.tracks.items.forEach((track) => {
                var title = track.track.artists[0].name + " - " + track.track.name;
                //console.log(title);
                titles.push(title);
            })
            sendPlaylistEmbed(message);
            searching = true;
        }, function (err) {
            console.log('Something went wrong!', err);
        });
}

// sends a list of the titles from the spotify playlist
function sendPlaylistEmbed(message) {
    var newEmbed = new Discord.MessageEmbed()
    .setTitle("Which song would you like to search?");
    var description = "";
    var i = 1;
    titles.forEach((title) => {
        description =  description + i + ". " + title + "\n";
        i++;
    })
    newEmbed
    .setDescription(description)
    .setFooter("Type in the number of the track you want to search!");
    message.channel.send(newEmbed);
}

// searches for track at titles[trackNumber - 1]
// returns youtube link of the first search of the track title
function searchForTrack(channel, trackNumber) {
    google.youtube('v3').search.list({
        key: process.env.YOUTUBE_TOKEN,
        part: 'snippet',
        q: titles[trackNumber - 1],
    }).then((response) => {
        const { data } = response;
        channel.send("Here's what I found for " + "**" + titles[trackNumber - 1] + "**" + ": https://www.youtube.com/watch?v=" + data.items[0].id.videoId);
        searching = !searching;
    }).catch((err) => console.log(err));
}

/*
!!! Need YouTube OAuth2 permissions for this function to work !!!

function createYouTubePlaylist() {
    return google.youtube('v3').playlists.insert({
        "part": [
            "snippet"
        ],
        "resource": {
            "snippet": {
                "title": "MaeshBot's Playlist"
            }
        }
    }).then(function (response) {
        console.log("Response", response);
    },
        function (err) { console.error("Execute error", err); });
}
*/

// EFFECT: Commands you can use while the bot is online
bot.on('message', (message) => {

    const author = message.author.username;

    if (!message.author.bot) {
        var link = message.content.split(' ')[1];
        var id;
        if (message.content.startsWith(prefix + 'hello')) {
            message.reply('Hi, ' + author);
        } else if (message.content.startsWith(prefix + 'convert')) {
            titles = [];
            if (isYouTubePlaylist(link)) {
                id = getYouTubePlaylistID(link);
                convertYouTubePlaylist(id, message);
            } else {
                message.channel.send('Please use a valid YouTube playlist link!');
            }
        } else if (message.content.startsWith(prefix + 'search')) {
            titles = [];
            if (isSpotifyPlaylist(link)) {
                id = getSpotifyPlaylistID(link);
                searchSpotifyPlaylist(id, message);
            } else {
                message.channel.send('Please use a valid Spotify playlist link!');
            }
            
        //} else if (message.content.startsWith(prefix + 'test')) {

        } else if (message.content.startsWith(prefix)) {
            message.channel.send('Sorry, I don\'t understand.');
        } else if (searching) {
            if (message.content == "cancel") {
                searching = !searching;
                message.channel.send('Cancelled search.');
            }
            var parsedMessage = parseInt(parseInt(message.content));
            if (parsedMessage != NaN && (parsedMessage > 0 && parsedMessage <= titles.length)) {
                searchForTrack(message.channel, parsedMessage);
            }
        } 
    }
});