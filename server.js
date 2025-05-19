// Charger les variables d'environnement
require('dotenv').config()

const express = require("express")
const http = require("http")
const path = require("path")
const app = express()
const server = http.createServer(app)
const io = require("socket.io")(server, {
	cors: {
		origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
		methods: ["GET", "POST"]
	}
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, 'frontend/build')))

// Gérer les autres routes en renvoyant l'application React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

// Gestion des connexions WebSocket
io.on("connection", (socket) => {
    console.log('Nouvelle connexion:', socket.id);
    socket.emit("me", socket.id)

    socket.on("disconnect", () => {
        console.log('Déconnexion:', socket.id);
        socket.broadcast.emit("callEnded")
    })

    socket.on("callUser", (data) => {
        console.log('Appel de', data.from, 'vers', data.userToCall);
        io.to(data.userToCall).emit("callUser", { 
            signal: data.signalData, 
            from: data.from, 
            name: data.name 
        })
    })

    socket.on("answerCall", (data) => {
        console.log('Réponse à l\'appel de', data.to);
        io.to(data.to).emit("callAccepted", data.signal)
    })
})

// Démarrer le serveur
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
})
