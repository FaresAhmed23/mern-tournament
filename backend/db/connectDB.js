import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb+srv://fero:xGhdnKjSk8Sv6stC@cluster0.ss8ad.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0')
        console.log(`MongoDb Connected: ${conn.connection.host}`)
    } catch(err) {
        console.error(err)
        process.exit(1)
    }
}
