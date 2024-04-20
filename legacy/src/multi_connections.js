// Connection hash, key is socket.id, value is Connection
var connections = {};

// Connection Class
function Connection() {
  var self = this;
  var id = ""; // socket.id of partner
  var peerconnection = null; // RTCPeerConnection instance
}

function getConnection(id) {
  var con = null;
  con = connections[id];
  return con;
}

function addConnection(id, connection) {
  connections[id] = connection;
}

function getConnectionCount() {
  var count = 0;
  for (var id in connections) {
    count++;
  }

  console.log("getConnectionCount=" + count);
  return count;
}

function getConnectionIndex(id_to_lookup) {
  var index = 0;
  for (var id in connections) {
    if (id == id_to_lookup) {
      return index;
    }

    index++;
  }

  // not found
  return -1;
}

function deleteConnection(id) {
  delete connections[id];
}

function stopAllConnections() {
  for (var id in connections) {
    var conn = connections[id];
    conn.peerconnection.close();
    conn.peerconnection = null;
    delete connections[id];
  }
}

function stopConnection(id) {
  var conn = connections[id];
  if (conn) {
    console.log("stop and delete connection with id=" + id);
    conn.peerconnection.close();
    conn.peerconnection = null;
    delete connections[id];
  } else {
    console.log("try to stop connection, but not found id=" + id);
  }
}

function isPeerStarted() {
  if (getConnectionCount() > 0) {
    return true;
  } else {
    return false;
  }
}

function onCandidate(evt) {
  var id = evt.from;
  var conn = getConnection(id);
  if (!conn) {
    console.error("peerConnection not exist!");
    return;
  }

  var candidate = new RTCIceCandidate({
    sdpMLineIndex: evt.sdpMLineIndex,
    sdpMid: evt.sdpMid,
    candidate: evt.candidate,
  });
  console.log("Received Candidate...");
  console.log(candidate);
  conn.peerconnection.addIceCandidate(candidate);
}

// parse query string and get roomname
function getRoomName() {
  var url = document.location.href;
  var args = url.split("?");
  if (args.length > 1) {
    var room = args[1];
    if (room != "") {
      return room;
    }
  }
  return "_defaultroom";
}
