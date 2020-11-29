var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require("./lib/template.js");//template를 사용하기 위해 사용
var path = require("path");//path에 ..등 여러 정보들이 들어오면 거르기 위하여 사용
var sanitizeHtml = require('sanitize-html');//출력 보안을 위하여 사용

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    if(pathname === '/'){
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'welcome';
          var description = 'Hello, Node.js';
          var list = template.List(filelist);
          var html = template.HTML(title, list,
            `<h2>${title}</h2><p>${description}</p>`,
            `<a href="/create">create</a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      }//메인 홈 화면
      else{
        fs.readdir('./data', function(error, filelist){
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description,{
              allowedTags:["h1"]
            });//내용에 h1태그는 허용하도록 함
            var list = template.List(filelist);
            var html = template.HTML(sanitizedTitle, list,
              `<h2>${sanitizedTitle}</h2><p>${sanitizedDescription}</p>`,
              `<a href="/create">create</a>
                <a href="/update?id=${sanitizedTitle}">update</a>
                <form action = "delete_process" method = "post">
                  <input type = "hidden" name = "id" value = "${sanitizedTitle}">
                  <input type = "submit" value = "delete">
                </form>
              `
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }//특정 id가 있는 경우의 화면
    } else if(pathname === '/create'){
      fs.readdir('./data', function(error, filelist){
        var title = 'WEB - create';
        var list = template.List(filelist);
        var html = template.HTML(title, list, `
          <form action="create_process" method = "post">
            <p><input type="text" name = "title" placeholder="title"></p>
            <p>
              <textarea name = "description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
          `, '');
        response.writeHead(200);
        response.end(html);
      });//create 화면
    }else if(pathname === '/create_process'){
      var body = '';
      request.on('data', function(data) {
        body += data;
        /*if(body.length > 1e6){
          request.connection.destroy():
        }//용량이 크게 들어오면 접속 끊기*/
      });
      request.on('end',function(){
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.writeHead(302, {Location : `/?id=${title}`});//페이지 이동
          response.end();
        });
      });//작성 요청 처리
    } else if(pathname === "/update"){
      fs.readdir('./data', function(error, filelist){
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
          var title = queryData.id;
          var list = template.List(filelist);
          var html = template.HTML(title, list,
            `
              <form action="/update_process" method = "post">
                <input type = "hidden" name = "id" value = "${title}">
                <p><input type = "text" name = "title" placeholder="title" value = ${title}></p>
                <p>
                  <textarea name = "description" placeholder="description">${description}</textarea>
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      });//업데이트 창
    } else if(pathname === "/update_process"){
      var body = '';
      request.on('data', function(data) {
        body += data;
        /*if(body.length > 1e6){
          request.connection.destroy():
        }//용량이 크게 들어오면 접속 끊기*/
      });
      request.on('end',function(){
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description;
        fs.rename(`data/${id}`, `data/${title}`, function(error){
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location : `/?id=${title}`});//페이지 이동
            response.end();
          });
        })
        console.log(post);
      });//업데이트 요청 처리
    } else if(pathname === "/delete_process"){
      var body = '';
      request.on('data', function(data) {
        body += data;
        /*if(body.length > 1e6){
          request.connection.destroy():
        }//용량이 크게 들어오면 접속 끊기*/
      });
      request.on('end',function(){
        var post = qs.parse(body);
        var id = post.id;
        var filteredId = path.parse(id).base;
        fs.unlink(`data/${filteredId}`, function(error){
          response.writeHead(302, {Location : `/`});//페이지 이동
          response.end();
        })
      });//업데이트 요청 처리
    }else{
      response.writeHead(404);
      response.end('Not found');
    }

});
app.listen(3000);//포트번호
