const express = require('express');
const app = express();

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({userV0: [], userV1: []});

app.set('view engine', 'ejs');
app.set('views', 'view_ejs');
app.use(express.static('image'));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



var UserList = {

    hasUser : function(name, ID) {
        if (this.loadUserV0(ID)) {
            db.get('userV1').push({
                name: name,
                ID: ID,
                status: this.loadUserV0(ID).status
            }).write();
            db.get('userV0')
            .remove({
                ID: ID
            }).write();
        }
        return (this.loadUser(name)) ? true : false;
    },

    loadUserV0 : function(ID) {
        return db.get('userV0')
            .find({
                ID: ID
            })
            .value();
    },

    loadUser : function(name) {
        return db.get('userV1')
            .find({
                name: name
            })
            .value();
    },

    addUser : function(name, ID) {
        db.get('userV1').push({
            name: name,
            ID: ID,
            status: [false,false,false,false,false,false,false,false]
        }).write();
    },

    deleteUser : function(name) {
        db.get('userV1')
        .remove({
            name: name
        })
        .write();
    },

    loadUserStatus : function(name) {
        return this.loadUser(name).status;
    },

    makeNewqQuery : function(name, idx, bool) {
        var query = this.loadUser(name).status;
        query[idx] = bool;
        return query;
    },

    modifyQuery : function(name, idx, bool) {
        var newQuery = this.makeNewqQuery(name, idx, bool);
        db.get('userV1')
        .find({
            name: name
        })
        .assign({
            status: newQuery
        })
        .write();
    },

    loadUserList : function() {
        return db.get('userV1').sortBy('ID').value();
    }

};


var Util = {

    isObjEmpty : function(obj) {
        if (typeof(obj) != 'object') return true;
        if (Object.keys(obj).length === 0) return true;
        return false;
    }

}


var Cookie = {

    getCookie : function(req) {
        return req.cookies;
    },

    hasCookie : function(req) {
        return (!Util.isObjEmpty(req.cookies) && req.cookies.name);
    },

    getID : function(req) {
        return this.getCookie(req).ID;
    },

    getName : function(req) {
        return this.getCookie(req).name;
    },

    setID : function(res, ID) {
        res.cookie('ID', ID, {maxAge:31536000});
    },

    setName : function(res, name) {
        res.cookie('name', name, {maxAge:31536000});
    }

};

var Body = {

    getID : function(req) {
        return req.body.ID;
    },

    getName : function(req) {
      return req.body.name;
    },

    getIdx : function(req) {
      return req.body.idx;
    },

    getBool : function(req) {
      return req.body.bool;
    }

}


var Query = {

    arr : [
        "OaUAPlcBfb1J",
        "iNDoUG2LKaUr",
        "RAScMfXtOFr3",
        "IimiXcK4StXt",
        "XPUOqiFcfU6C",
        "FtKWK7eHlZZe",
        "l8BDfGdWbMtD",
        "rQDIO9bCtmEZ"
    ],

    transQueryToInt : function(query) {
        return this.arr.indexOf(query);
    },

    hasQuery : function(req) {
        return !Util.isObjEmpty(req.query);
    },

    isQueryValid : function(req) {
        if (Object.keys(req.query).length != 1) return false;
        if (req.query.key == undefined) return false;
        if (this.transQueryToInt(req.query.key) == -1) return false;
        return true;
    },

    getQuery : function(req) {
        return req.query.key;
    }

};


var Manage = {

    setAccessOnModify : function(res) {
        res.cookie('authority', 'PoIIAe1bXoWe', {maxAge:31536000});
    },

    setAccessOnWatch : function(res) {
        res.cookie('authority', 'oGa2DGfHTeID', {maxAge:31536000});
    },

    hasAccessOnModify : function(req) {
        return (req.cookies.authority == 'PoIIAe1bXoWe') ? true : false;
    },

    hasAccessOnWatch : function(req) {
        return (req.cookies.authority == 'oGa2DGfHTeID' || 'PoIIAe1bXoWe') ? true : false;
    }

}

var Route = {
    getMainRequest : function(req, res) {
        if (!Cookie.hasCookie(req))
            res.redirect('login_face');
        else {
            var ID = Cookie.getID(req);
            var name = Cookie.getName(req);

            if (!UserList.hasUser(name, ID))
                UserList.addUser(name, ID);

            if (Query.hasQuery(req)) {
                if (Query.isQueryValid(req))
                    UserList.modifyQuery(name, Query.transQueryToInt(Query.getQuery(req)));
                res.redirect('main');
            } else
                res.render('main', UserList.loadUser(name));
        }
    },

    getLoginRequest : function(req, res) {
        res.render('login');
    },

    getManageRequest : function(req, res) {
        if (Manage.hasAccessOnWatch(req))
            res.render('manage', { list: UserList.loadUserList() });
        else
            res.send();
    },

    postLoginRequest : function(req, res) {
        Cookie.setID(res, Body.getID(req));
        Cookie.setName(res, Body.getName(req));
        res.redirect('main');
    },

    setAccessAuthority : function(req, res) {
        var key = Query.getQuery(req);
        console.log(key)
        if (key == '1MtEghjgLKLK')
            Manage.setAccessOnWatch(res);
        else if (key == 'ZDUtiAsRQdp2')
            Manage.setAccessOnModify(res);
        res.redirect('manager');
    },

    ajaxDeleteRequest : function(req, res) {
        if (Manage.hasAccessOnModify(req)) {
            var name = Body.getName(req);
            UserList.deleteUser(name);
        } else
            req.body.authorityVerdict = false;
        res.send(req.body);
    },

    ajaxModifyRequest : function(req, res) {
        if (Manage.hasAccessOnModify(req)) {
            var name = Body.getName(req);
            var idx = Body.getIdx(req);
            var bool = Body.getBool(req);
            UserList.modifyQuery(name, idx, bool);
        } else
            req.body.authorityVerdict = false;
        res.send(req.body);
    }

}

app.get('/login', Route.getLoginRequest);
app.get('/main', Route.getMainRequest);
app.get('/manager', Route.getManageRequest);
app.post('/user_info', Route.postLoginRequest);
app.post('/delete_user', Route.ajaxDeleteRequest);
app.post('/modify_user', Route.ajaxModifyRequest);
app.get('/access_manager', Route.setAccessAuthority);

app.listen(80, () => console.log('server is running'));
