/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Component } from 'react'
import { Image, ImageBackground, TouchableOpacity, Text, View, ScrollView, StyleSheet } from 'react-native'

// rn-client must be imported before FirebaseConnector
import client, { Avatar, TitleBar } from '@doubledutch/rn-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
import {mapPushedDataToStateObjects} from './firebaseHelpers'
import {background, trophy} from './images'
import {Button} from './components'
const fbc = FirebaseConnector(client, 'trivia')

fbc.initializeAppWithSimpleBackend()
const userRef = fbc.database.private.adminableUserRef()

export default class HomeView extends Component {
  state = {sessions: {}}
  constructor() {
    super()
    this.signin = fbc.signin()
      .then(user => this.user = user)

    this.signin.catch(err => console.error(err))
  }

  componentDidUpdate() {
    const {sessionId, sessions} = this.state
    // If there is only one session, pick that automatically.
    if (!sessionId && Object.keys(sessions).length === 1) {
      this.setState({sessionId: Object.keys(sessions)[0]}) 
    }
  }

  componentDidMount() {
    this.signin.then(() => {
      mapPushedDataToStateObjects(fbc.database.public.adminRef('sessions'), this, 'sessions')
      userRef.on('value', data => this.setState({me: data.val()}))
    })
  }

  render() {
    const {sessionId, sessions, me} = this.state
    const session = sessions[sessionId]
    const meJoined = (me && me.sessionId === sessionId) ? me : null

    return (
      <ImageBackground style={s.container} source={background}>
        <TitleBar title="Trivia" client={client} signin={this.signin} />
        <ScrollView style={s.scroll}>
          { session
            ? this.renderSession(session, meJoined)
            : this.renderSessions(sessions)
          }
        </ScrollView>
      </ImageBackground>
    )
  }

  renderSession = (session, meJoined) => {
    if (!meJoined) return this.renderNotJoined(session)

    switch (session.state) {
      case 'NOT_STARTED': return this.renderNotStartedSession(session)
      case 'ACCEPTING_ANSWERS': return this.renderAcceptingAnswers(session)
      case 'QUESTION_FINISHED': return this.renderQuestionFinished(session)
      case 'ENDED': return this.renderEndedSession(session)
      default: return null
    }
  }

  renderNotJoined = session => {
    return (
      <View style={s.notJoined}>
        <Text style={s.joinTitle}>TRIVIA</Text>
        <Image source={trophy} style={s.trophy} />
        <Text style={s.joinTitle}>CHALLENGE</Text>
        <Text style={s.joinSessionName}>{session.name}</Text>
        <Button title="Let's Play!" onPress={this.join} backgroundColor="#2da99f" color="#fff" />
      </View>
    )
  }

  renderSessions = sessions => {
    return (
      <View style={s.box}>
      </View>
    )
  }
  
  renderNotStartedSession = session => {
    return (
      <View style={s.box}>
        <Text>Waiting...</Text>
      </View>
    )
  }
  
  renderAcceptingAnswers = session => {
    return (
      <View style={s.box}>
      </View>
    )
  }
  
  renderQuestionFinished = session => {
    return (
      <View style={s.box}>
      </View>
    )
  }
  
  renderEndedSession = session => {
    return (
      <View style={s.box}>
      </View>
    )
  }

  join = () => userRef.set({...client.currentUser, sessionId: this.state.sessionId})
}

const sessionsRef = () => fbc.database.public.adminRef('sessions')

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    padding: 15
  },
  box: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
  },
  notJoined: {
    alignItems: 'center',
  },
  joinTitle: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  joinSessionName: {
    textAlign: 'center',
    backgroundColor: 'transparent',
    fontSize: 24,
    color: '#684f82',
    marginVertical: 15,
  },
  trophy: {
    width: 200,
    height: 159,
    marginVertical: 30,
  },
})
