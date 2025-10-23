function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Se a URI termina com /, adiciona index.html
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // Se a URI não tem extensão e não termina com /, adiciona /index.html
    else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }

    return request;
}
