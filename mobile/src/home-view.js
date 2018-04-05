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
import {mapPerUserPushedDataToStateObjects} from './firebaseHelpers'
import {background, trophy} from './images'
import {Button} from './components'
import { mapPushedDataToStateObjects } from './firebaseHelpers';

const fbc = FirebaseConnector(client, 'trivia')

fbc.initializeAppWithSimpleBackend()
const sessionsRef = fbc.database.public.adminRef('sessions')
const userRef = fbc.database.public.userRef()
const usersRef = fbc.database.public.usersRef()

const numJoinedToShow = 5

export default class HomeView extends Component {
  state = {sessions: {}, users: {}}
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
      sessionsRef.on('value', data => this.setState({sessions: data.val()}))
      userRef.on('value', data => this.setState({me: data.val()}))
      mapPushedDataToStateObjects(usersRef, this, 'users')
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
          { me === undefined
            ? null
            : session
              ? this.renderSession(session, meJoined)
              : this.renderSessions(sessions, me)
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
        <Text style={s.whiteTitle}>TRIVIA</Text>
        <Image source={trophy} style={s.trophy} />
        <Text style={s.whiteTitle}>CHALLENGE</Text>
        <Text style={s.joinSessionName}>{session.name}</Text>
        <Button title="Let's Play!" onPress={this.join} />
      </View>
    )
  }

  renderSessions = (sessions, me) => {
    const currentSessions = Object.keys(sessions)
      .map(id => ({...sessions[id], id}))
      .filter(s => s.state !== 'ENDED' || s.id === me.sessionId)
    if (currentSessions.length === 0) return <Text style={s.whiteTitle}>No trivia games currently. Try back later!</Text>
    return (
      <View style={s.box}>
        <Text style={s.tealText}>Choose a trivia game</Text>
        { currentSessions.map(s => (
          <Button key={s.id} title={s.name} onPress={this.selectSession(s)} />
        ))}
      </View>
    )
  }
  
  renderNotStartedSession = session => {
    const {users, sessionId} = this.state
    const joined = Object.values(users).filter(u => u.sessionId === sessionId)
    return (
      <View style={s.box}>
        <Text style={s.youAreIn}>You are in!</Text>
        <Text style={s.joinCount}>{joined.length - 1}</Text>
        <Text style={s.haveJoined}>{joined.length === 1 ? 'Other Has Joined':'Others Have Joined'}</Text>
        { joined.slice(Math.max(0,joined.length-numJoinedToShow)).map((u,i) => (
          <View key={u.id} style={[s.joinedUser, i===0 ? {opacity:0.5} : null]}>
            <Avatar user={u} size={30} />
            <Text style={s.joinedUserName}>{u.firstName} {u.lastName}</Text><Text style={s.hasJoined}> has joined</Text>
          </View>
        ))}
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
  selectSession = session => () => this.setState({sessionId: session.id})
}

const orange = '#f97d64'
const purple = '#684f82'
const teal = '#2da99f'
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
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  notJoined: {
    alignItems: 'center',
  },
  whiteTitle: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  tealText: {
    color: teal,
    fontSize: 20,
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
  youAreIn: {
    color: orange,
    fontSize: 16,
  },
  joinCount: {
    color: teal,
    fontSize: 100,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  haveJoined: {
    color: purple,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  joinedUser: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginVertical: 7,
  },
  joinedUserName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: purple,
  },
  hasJoined: {
    fontSize: 16,
    color: purple,    
  },
})
