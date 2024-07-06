import React, { Component } from 'react'
import Particles from 'react-tsparticles'
import { loadFull } from "tsparticles"
import Navigation from './components/Navigation/Navigation'
import FaceRecognition from './components/FaceRecognition/FaceRecognition'
import Logo from './components/Logo/Logo'
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm'
import Rank from './components/Rank/Rank'
import 'tachyons'
import './App.css'
import SignIn from './components/SignIn/SignIn'
import Register from './components/Register/Register'

const particlesInit = async (main) => {
  // console.log(main);
  await loadFull(main);
}

const particlesLoaded = async (container) => {
  // console.log(container);
  await container
}

const particlesOptions = {
  background: {
  color: "none",
  },
  particles: {
      links: {
          distance: 125,
          enable: true,
          triangles: {
              enable: true,
              opacity: 0.05,
          },
      },
      move: {
          enable: true,
          speed: 1,
      },
      size: {
          value: 1,
      },
      shape: {
          type: "circle",
      },
  }
}


const initialState = {
  input: '',
  imageUrl: '',
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}

class App extends Component {
  constructor() {
    super() 
      this.state = initialState
  }
  loadUser = (data) => {
    this.setState({user: 
      {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    })
  }

  calculateFaceLocation = (data) => {
    if (data.outputs && data.outputs[0].data.regions) {
      const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
      const image = document.getElementById('inputImage')
      const width = Number(image.width)
      const height = Number(image.height)
      return {
          leftCol: clarifaiFace.left_col * width,
          topRow: clarifaiFace.top_row * height,
          rightCol: width - (clarifaiFace.right_col * width),
          bottomRow: height - (clarifaiFace.bottom_row * height)
        }
      }
      return null
     }

  displayFaceBox = (box) => {
    console.log('displayFaceBox:', box)
    if (box) {
      this.setState({box: box})
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value})
  }

  onPictureSubmit = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL
    console.log('Backend URL:', backendUrl)
    this.setState({imageUrl: this.state.input})
    fetch(`${backendUrl}/imageurl`, {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          input: this.state.input
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`)
        }
        return response.json()
      })
      .then(response => {
        console.log('Clarifai API Response:', response)
        if (response) {
            fetch(`${backendUrl}/image`, {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count}))
            })
            .catch(console.log)
        }
        const faceBox = this.calculateFaceLocation(response)
        this.displayFaceBox(faceBox)
      })
      .catch(err => console.error('Error:', err))
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route})
  }

  render() {
    const { isSignedIn, imageUrl, route, box } = this.state
    return (
      <div className="App">
        <Particles className='particles' 
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={particlesOptions}
        />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
          { route === 'home' ? 
          <div>
            <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries} />
            <ImageLinkForm 
            onInputChange={this.onInputChange} 
            onPictureSubmit={this.onPictureSubmit} />
            <FaceRecognition box={box} imageUrl={imageUrl} /> 
          </div>
          : (
            this.state.route === 'signin' 
            ? < SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
            : < Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
            )
          }
      </div>
    )
  }
}
export default App;
