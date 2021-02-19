const socket = io();

// element from the dom, always put $ in front of name of element
const $messageform = document.querySelector('#message-form');
const $messageFormInput = $messageform.querySelector('input');
const $messageFormButton = $messageform.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// options
const string = location.search.slice(1)
const indexofconnect = string.indexOf('&');
const username = string.slice(9,indexofconnect)
const room = string.slice(indexofconnect+6)

const autoscroll = () =>{
    const $newMessage = $messages.lastElementChild;
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollheight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    });
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll();
})

socket.on('locationMessage', location=>{
    console.log(location)
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format('h:mm A')
    });
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageform.addEventListener('submit', (e)=>{
    e.preventDefault();
    const message = e.target.elements.message.value;

    $messageFormButton.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage',message, (error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value='';
        $messageFormInput.focus();
        if (error){
            console.log(error)
        }
        console.log('The message is delivered')
    });
})

$locationButton.addEventListener('click', ()=>{
    if (!navigator.geolocation) {
        return alert('geolocation is not supported by your browser')
    }
    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, ()=>{
            $locationButton.removeAttribute('disabled');
            console.log('location shared!')
        })
    })
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})