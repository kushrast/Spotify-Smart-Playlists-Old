import requests
import base64

with open('spotify.config','r') as f:
	client_id = f.readline().rstrip('\n')
	client_secret = f.readline().rstrip('\n')

def retrieve_access_token():
	#curl -X "POST" -H "Authorization: Basic ZjM4ZjAw...WY0MzE=" -d grant_type=client_credentials https://accounts.spotify.com/api/token
	header = {
		"Authorization" : "Basic " + base64.b64encode(client_id+":"+client_secret)
	}
	data = {
		"grant_type" : 'client_credentials'
	}

	r = requests.post("https://accounts.spotify.com/api/token", headers = header, data = data)
	return r.json()["access_token"]

def get_album_tracks(access_token):
	#curl -X GET "https://api.spotify.com/v1/users/wizzler/playlists" -H "Authorization: Bearer {your access token}"
	header = {
		"Authorization" : "Bearer " + access_token
	}
	user_id = "spotify"
	playlist_id = "37i9dQZF1DXcBWIGoYBM5M"

	r = requests.get("https://api.spotify.com/v1/users/%s/playlists/%s" % (user_id, playlist_id), headers = header)

	tracks = [track["track"]["id"] for track in r.json()["tracks"]["items"]]
	return tracks

def get_features(access_token, tracks):
	#curl -X GET "https://api.spotify.com/v1/audio-features/?ids=4JpKVNYnVcJ8tuMKjAj50A,2NRANZE9UCmPAS5XVbXL40,24JygzOLM0EmRQeGtFcIcG" -H "Authorization: Bearer {your access token}"
	header = {
		"Authorization" : "Bearer " + access_token
	}
	ids = ",".join(tracks)
	r = requests.get("https://api.spotify.com/v1/audio-features/?ids=%s" % (ids), headers = header)
	print(r.content)

access_token = retrieve_access_token()
tracks = get_album_tracks(access_token)
get_features(access_token, tracks)