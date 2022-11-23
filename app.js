const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "./cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
  app.listen(3000, () => {
    console.log("Server successfully started");
  });
};

initializeDBAndServer();

const playerConvertDbToResponse = (dbObject) => ({
  playerId: dbObject.player_id,
  playerName: dbObject.player_name,
});

const matchConvertDbToResponse = (dbObject) => ({
  matchId: dbObject.match_id,
  match: dbObject.match,
  year: dbObject.year,
});

//Get player Details API

app.get("/players/", async (request, response) => {
  const playersListQuery = `SELECT * FROM player_details`;
  const dbResponse = await db.all(playersListQuery);
  response.send(
    dbResponse.map((eachPlayer) => playerConvertDbToResponse(eachPlayer))
  );
});

//Get specific player Details API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const dBResponse = await db.get(getPlayerDetailsQuery);
  response.send(playerConvertDbToResponse(dBResponse));
});

//Update a player details API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId}`;
  const dBResponse = await db.run(updateQuery);
  response.send("Player Details Updated");
});

//Get specific match details

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
  const dBResponse = await db.get(getMatchDetailsQuery);
  response.send(matchConvertDbToResponse(dBResponse));
});

//API5 - Get all the matches played by a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsQuery = `SELECT match_details.match_id,match_details.match,match_details.year
    FROM player_match_score JOIN match_details ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId}
    `;
  const dBResponse = await db.all(getMatchDetailsQuery);
  response.send(dBResponse.map((each) => matchConvertDbToResponse(each)));
});

//API6 - Get all the players of a match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT player_details.player_id,player_details.player_name
    FROM player_match_score JOIN player_details on player_match_score.player_id = player_details.player_id
    WHERE player_match_score.match_id = ${matchId}
    `;
  const dBResponse = await db.all(getPlayersQuery);
  response.send(dBResponse.map((each) => playerConvertDbToResponse(each)));
});

//API 7 - Get the stats of a player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `SELECT player_details.player_id,player_details.player_name,
  SUM(score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes
    FROM player_match_score JOIN player_details on player_match_score.player_id = player_details.player_id
    WHERE player_match_score.player_id = ${playerId}
    `;
  const dBResponse = await db.all(getStatsQuery);
  const formattedResponse = {
    playerId: dBResponse[0].player_id,
    playerName: dBResponse[0].player_name,
    totalScore: dBResponse[0].totalScore,
    totalFours: dBResponse[0].totalFours,
    totalSixes: dBResponse[0].totalSixes,
  };
  response.send(formattedResponse);
});

module.exports = app;
