const Discord = require('discord.js');
const { google } = require('googleapis');
const Spotify = require('spotify-web-api-node');

const bot = new Discord.Client();

const prefix = '$';

require('dotenv').config();

var titles = []; // titles of the youtube videos

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

/*spotifyApi.getAlbum('5U4W9E5WsYb2jUQWePT8Xm')
    .then(function (data) {
        console.log('Album information', data.body);
    }, function (err) {
        console.error(err);
    });*/

// adds a track to a playlist
// trackId is a Spotify track ID
// playlist is a Spotify playlist ID
function addToPlaylist(trackId, playlist) {
  spotifyApi.addTracksToPlaylist(playlist, [`spotify:track:${trackId}`])
  .then(function(data) {
    console.log('Added tracks to playlist!');
  }, function(err) {
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

// creates a new playlist and calls searchAndAdd()
function createPlaylist(message) {
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


// returns youtube playlistID from a youtube playlist link
function getPlaylistID(link) {
    var id;
    var indexEndOfID = link.indexOf("&", link.search("list=") + 5)
    if (indexEndOfID != -1) {
        id = link.slice(((link.search("list=")) + 5), indexEndOfID);
    } else {
        id = link.slice((link.search("list=")) + 5);
    }
    //console.log(id);
    return id;
}

// converts a playlist from youtube to spotify
// playlistID is the playlist id of the youtube playlist
function convertPlaylist(playlistID, message) {
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
        createPlaylist(message);
        

    }).catch((err) => console.log(err));
}

// EFFECT: Commands you can use while the bot is online
bot.on('message', (message) => {

    const author = message.author.username;

    if (!message.author.bot) {
        if (message.content.startsWith(prefix + 'hello')) {
            message.reply('Hi: ' + message.content.split(' ')[1]);
        } else if (message.content.startsWith(prefix + 'convert')) {
            var id = getPlaylistID(message.content.split(' ')[1]);
            convertPlaylist(id, message);
            titles = [];
        } //else if (message.content.startsWith(prefix + 'createPlaylist')) {
            //createPlaylist();}
         else if (message.content.startsWith(prefix)) {
            message.reply('Sorry, I don\'t understand.');
        }
    }
});



