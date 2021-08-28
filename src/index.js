const express = require('express');
const app = new express();
const port = process.env.PORT;
const UserRouter = require('./routes/UserRouter');
const PostRouter = require('./routes/PostRouter');
const TagRouter = require('./routes/TagRouter');
const FollowupRouter = require('./routes/FollowupRouter');
const NotificationRouter = require('./routes/NotificationRouter');
require('../src/db/mysql');

app.use(express.json({ limit: '25mb' }));
app.use(
    express.urlencoded({ limit: '25mb', extended: true, parameterLimit: 200000 }),
    express.raw({ limit: '25mb' })
);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE'
    );
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    next();
});

app.use([
    UserRouter,
    PostRouter,
    TagRouter,
    FollowupRouter,
    NotificationRouter
]);
app.listen(port, () => {
    console.log('Server is up on port', port);
});