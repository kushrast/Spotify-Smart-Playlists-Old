import requests
import base64

with open('spotify.config','r') as f:
	client_id = f.readline().rstrip('\n')
	client_secret = f.readline().rstrip('\n')

#Client Credential Authorization Flow
def retrieve_client_credential_access_token():
	#curl -X "POST" -H "Authorization: Basic ZjM4ZjAw...WY0MzE=" -d grant_type=client_credentials https://accounts.spotify.com/api/token
	header = {
		"Authorization" : "Basic " + base64.b64encode(client_id+":"+client_secret)
	}
	data = {
		"grant_type" : 'client_credentials'
	}

	r = requests.post("https://accounts.spotify.com/api/token", headers = header, data = data)
	return r.json()["access_token"]

def get_track_information(access_token, song_id):
	#curl -X "GET" "https://api.spotify.com/v1/tracks/" -H "Accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer BQAQ608S2j09gEqBUhaJUFGQ7RtGEaZqbd424y5PcNWHQuBfjIySZYIsr70grnrBInGNznGew1d6JWX7EY6Q4_qObpTlwlHLwfDLnIy6xTnhPhAQBUpNU6kNC6FJyanogm9eT325W416Cw"
	header = {
		"Authorization" : "Bearer " + access_token,
		"Accept" : "applications/json",
		"Content-Type" : "applications/json"
	}

	r = requests.get("https://api.spotify.com/v1/tracks/%s" % (song_id), headers = header)
	return r.json()

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
	features = r.json()["audio_features"]

	feature = "energy"
	min_tempo = min(features, key = lambda x: x[feature])
	max_tempo = max(features, key = lambda x: x[feature])

	min_track = get_track_information(access_token, min_tempo["id"])["name"]
	max_track = get_track_information(access_token, max_tempo["id"])["name"]

	print(feature)
	print(min_track + " " + str(min_tempo[feature]))
	print(max_track + " " + str(max_tempo[feature]))

access_token = retrieve_client_credential_access_token()
tracks = get_album_tracks(access_token)
get_features(access_token, tracks)