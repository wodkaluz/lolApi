var express = require(`express`);
var app = express();
var rp = require('request-promise-native');
var api_key = 'RGAPI-d5665446-c688-4c0f-8890-26c0e95e2aa7';

app.use(express.static(__dirname + '/public'))

function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
function getChampion(obj,championsList){
  for (var key in championsList.data) {
    var champ = championsList.data[key];
    if (champ.key == obj){
      return ('<img src= "http://ddragon.leagueoflegends.com/cdn/6.24.1/img/champion/'+key+'.png">'+key);
    }
  }
}
function getQueue(matchById){
  switch (matchById.queue){
    case 420: return "Ranked Solo";break;
    case 430: return "5v5 Blind Pick";break;
    case 440: return "5v5 Ranked Flex";break;
    case 450: return "ARAM";break;
    case 460: return "3v3 Blind Pick";break;
    case 470: return "3v3 Ranked Flex";break;
    case 400: return "5v5 Draft Pick";break;
    case 325: return "All Random";break;
    default: return "Bot/Special Queue";break;
  }
}


function getItem(obj,itemsList){
  for (var key in itemsList.data) {
    var item = itemsList.data[key];
    if (key == obj){
      return ('<img src= "http://ddragon.leagueoflegends.com/cdn/6.24.1/img/item/'+obj+'.png">'+item.name);
    }
  }
  return "EMPTY";
}
function getSpell(obj,spellsList){
  var aux='<img src="http://ddragon.leagueoflegends.com/cdn/6.24.1/img/spell/';
  for (var key in spellsList.data) {
    var spell = spellsList.data[key];
    if (spell.key == obj){
        aux += key;
        aux +='.png" alt="test">';
      return aux;
    }
  }
}
function getUrlMatchById(gameId,server,api_key){
  var urlMatchById = 'https://'+server+'.api.riotgames.com/lol/match/v3/matches/'+gameId+'?api_key='+api_key;
  return urlMatchById;
}
function getParticipantById(matchById,player){
  for (var i=0;i<matchById.participantIdentities.length;i++) {
    var participant = matchById.participantIdentities[i];
    if (participant.player.summonerId == player.id){
      return participant.participantId;
    }
  }
}
function getMatchInfo(matchById,participantId,spellsList,championsList,itemsList){
    var timeM = Math.floor(matchById.gameDuration/60)
    var timeS = (matchById.gameDuration - timeM*60);
    var time = 'Match Duration: '+timeM+'m '+timeS+'s';
    var gameInfo = matchById.participants[participantId];
    var spell1 = 'spell1: '+getSpell(gameInfo.spell1Id,spellsList);
    var spell2 = 'spell2: '+getSpell(gameInfo.spell2Id,spellsList);
    var champion = 'Champion: ' +getChampion(gameInfo.championId,championsList);
    var result = gameInfo.stats.win;
    if (result == true){
      result = 'VICTORY';
    }
    else{
      result = 'DEFEAT';
    }
    var kills = gameInfo.stats.kills;
    var deaths = gameInfo.stats.deaths;
    var assists = gameInfo.stats.assists;
    var kda = 'KDA: '+kills+"/"+deaths+"/"+assists;
    var level = 'Level: '+gameInfo.stats.champLevel;
    var minions = 'Minions Killed: '+gameInfo.stats.totalMinionsKilled;
    var neutrals = 'Neutrals Killed: '+gameInfo.stats.neutralMinionsKilled;
    var totalCS = 'Total Farm: '+(gameInfo.stats.totalMinionsKilled + gameInfo.stats.neutralMinionsKilled);
    var perMinCS = 'Farm/Min: '+parseFloat(((gameInfo.stats.totalMinionsKilled + gameInfo.stats.neutralMinionsKilled)/timeM)).toFixed(2);
    var item1 = 'Item1: '+getItem(gameInfo.stats.item0,itemsList);
    var item2 = 'Item2: '+getItem(gameInfo.stats.item1,itemsList);
    var item3 = 'Item3: '+getItem(gameInfo.stats.item2,itemsList);
    var item4 = 'Item4: '+getItem(gameInfo.stats.item3,itemsList);
    var item5 = 'Item5: '+getItem(gameInfo.stats.item4,itemsList);
    var item6 = 'Item6: '+getItem(gameInfo.stats.item5,itemsList);
    var totem = 'Totem: '+getItem(gameInfo.stats.item6,itemsList);
    var infos = time+'<br>'+result+'<br>'+champion+'<br>'+level+'<br>'+spell1+'<br>'+spell2+'<br>'+kda+'<br>'+perMinCS+'<br>'+totalCS+'<br>'+minions+'<br>'+neutrals+'<br>'+item1+'<br>'+item2+'<br>'+item3+'<br>'+item4+'<br>'+item5+'<br>'+item6+'<br>'+totem;
    return infos;
}

app.use(express.urlencoded());

app.get('/lolApi', async function(req,res) {
  try {
    var user = encodeURI(req.param('user'));
    var server = req.param('server');


    var urlSummoner = 'https://'+server+'.api.riotgames.com/lol/summoner/v3/summoners/by-name/'+user+'?api_key='+api_key;
    var urlRanked = 'https://'+server+'.api.riotgames.com/lol/league/v3/positions/by-summoner/';
    var urlMatchRecent = 'https://'+server+'.api.riotgames.com/lol/match/v3/matchlists/by-account/';
    var urlMatchById;
    var message = '';
    var urlChampionsList ='http://ddragon.leagueoflegends.com/cdn/6.24.1/data/en_US/champion.json';
    var urlItemsList ='http://ddragon.leagueoflegends.com/cdn/6.24.1/data/en_US/item.json';
    var urlSpellsList = 'http://ddragon.leagueoflegends.com/cdn/6.24.1/data/en_US/summoner.json';
    var player = await rp.get(urlSummoner, {json: true}); //Requesting users info
    message+= '<img src= "http://ddragon.leagueoflegends.com/cdn/6.24.1/img/profileicon/'+player.profileIconId+'.png">';
    message+= "Nickname: "+ player.name + "<br>ID: " + player.id+"<br>Account ID: "+player.accountId+"<br>Level: "+player.summonerLevel; //Users Info
    urlRanked+= player.id+'?api_key='+api_key; //define player Ranking link
    urlMatchRecent+=player.accountId+'/recent?api_key='+api_key; //define recent matches link
    var playerRanked = await rp.get(urlRanked, {json: true}); //request player raking
    var playerRecent = await rp.get(urlMatchRecent, {json: true}); //request player recent matches
    var championsList = await rp.get(urlChampionsList, {json: true}); //requests championsList
    var itemsList = await rp.get(urlItemsList, {json: true});//requests ItemsList
    var spellsList = await rp.get(urlSpellsList, {json: true});//requests spellsList
//Case no ELO
    if (isEmptyObject(playerRanked)){
      message+= '<br>Rank: Unranked';
    }
    else{
      message+= '<br>Rank: '+playerRanked[0].tier+' '+playerRanked[0].rank;
    }
//Case no recent matches
    if (isEmptyObject(playerRecent)){
      message+= '<br>Recent Matches: NO RECENT MATCHES';
    }
    else{
      message+= '<br>Recent Matches: ';
    }
    //Testing championsList
      //console.log("Opções:", Object.keys(championsList.data));
//      console.log(champions[key]);
  //    console.log("test", champions.get(1));
    var nMatches = Object.keys(playerRecent.matches).length;
    //var nMatches = 2;
    var matchById = new Array(nMatches);
    for (var i=0;i<nMatches;i++){
      urlMatchById = getUrlMatchById(playerRecent.matches[i].gameId,server,api_key);//defines URL to Request Match Info JSON
      matchById[i] = await rp.get(urlMatchById, {json: true});//request matchById JSON
      var participantId = getParticipantById(matchById[i],player);
      message+= '<br><br>Match: '+(i+1)+'<br>';
      var queue = getQueue(playerRecent.matches[i]);
      message +=queue+"<br>";
      var matchInfo = getMatchInfo(matchById[i], participantId-1,spellsList,championsList,itemsList);
      message+= matchInfo;
    //  console.log(matchById[i]);
  //    console.log(matchById.gameDuration);
  //    matchById = await rp.get(urlMatchById, {json: true});//request matchById JSON
  //    var infos = getMatchInfo(matchById,player.id);
    }
//  console.log("Opções:", Object.keys(itemsList.data));
//      console.log(nome);
   res.send(message);
 } catch (err) {
     console.error("Erro:", err);
     res.status(500).json({error: err.message});
 }
});
//});//POST!!!
app.listen(5000);
console.log("API Running on PORT 5000");
