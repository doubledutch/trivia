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

import React, { PureComponent } from 'react'
import {
  Image,
  ImageBackground,
  Text,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'

// rn-client must be imported before FirebaseConnector
import client, { Avatar, TitleBar, translate as t, useStrings } from '@doubledutch/rn-client'
import {
  mapPushedDataToStateObjects,
  provideFirebaseConnectorToReactComponent,
} from '@doubledutch/firebase-connector'
import firebase from 'firebase/app'
import i18n from './i18n'
import { background, trophy } from './images'
import { Button } from './components'
import Leaderboard from './Leaderboard'
import LoadingView from './LoadingView'
import Admin from './Admin'
import Question from './Question'
import colors from './colors'

useStrings(i18n)

const numJoinedToShow = 5

class HomeView extends PureComponent {
  state = {
    sessions: {},
    adminSessions: {},
    users: {},
    answers: {},
    isAdminView: undefined,
    isAdmin: false,
    adminUrl: undefined,
    logInFailed: false,
    isLoggedIn: false,
    primaryColor: '#000000',
  }

  constructor(props) {
    super(props)

    this.signin = this.props.fbc.signin()
    this.signin.catch(err => console.error(err))
  }

  componentDidUpdate() {
    const { sessionId, sessions } = this.state
    // If there is only one session, pick that automatically.
    if (!sessionId && Object.keys(sessions).length === 1) {
      this.setState({ sessionId: Object.keys(sessions)[0] })
    }
  }

  componentDidMount() {
    client.getPrimaryColor().then(primaryColor => this.setState({ primaryColor }))
    client.getCurrentUser().then(currentUser => {
      this.setState({ currentUser })
      this.signin
        .then(() => {
          this.props.fbc.database.private
            .adminableUserRef('adminToken')
            .once('value', async data => {
              const longLivedToken = data.val()
              if (longLivedToken) {
                await firebase.auth().signOut()
                client.longLivedToken = longLivedToken
                await this.props.fbc.signinAdmin()
                console.log('Re-logged in as admin')
                this.setState({ isAdmin: true })
                this.getAdmin()
              } else {
                this.setState({ isAdminView: false })
              }
              this.wireListeners()
              this.hideLogInScreen = setTimeout(() => {
                this.setState({ isLoggedIn: true })
              }, 500)
            })
        })
        .catch(() => this.setState({ logInFailed: true }))
    })
  }

  getAdmin = () => {
    this.props.fbc.database.private
      .adminRef('adminUrl')
      .on('value', data => this.setState({ adminUrl: data.val() || undefined }))
    this.adminSessionsRef().on('value', data => {
      const adminSessions = data.val() || {}
      this.setState({ adminSessions })
      this.setState(prevState => {
        if (prevState.adminSessionId && !adminSessions[prevState.adminSessionId]) {
          // WE had a session ID, but that session is now gone, so remove the session ID.
          return {adminSessionId: undefined}
        }
        return {}
      })
    })
  }

  wireListeners = () => {
    this.backgroundUrlRef().on('value', data => this.setState({ backgroundUrl: data.val() }))
    this.sessionsRef().on('value', data => this.setState({ sessions: data.val() || {} }))
    this.userRef().on('value', data => this.setState({ me: data.val() }))
    this.answersRef().on('value', data => this.setState({ answers: data.val() || {} }))
    mapPushedDataToStateObjects(this.usersRef(), this, 'users')
  }

  cancelGame = () => {
    Alert.alert(
      t('confirm'),
      t('confirmExit'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            this.props.fbc.database.public
              .adminRef('sessions')
              .child(this.state.sessionId)
              .remove()

            // Remove users who were in the removed trivia session.
            this.props.fbc.database.public.usersRef().once('value', data => {
              const users = data.val() || {}
              Object.keys(users)
                .filter(id => users[id].sessionId === this.state.sessionId)
                .forEach(id =>
                  this.props.fbc.database.public
                    .usersRef()
                    .child(id)
                    .remove(),
                )
            })
            this.setState({
              adminSessionId: undefined,
              adminSessionName: undefined,
              sessionId: undefined,
              sessionName: undefined,
            })
          },
        },
      ],
      { cancelable: false },
    )
  }

  render() {
    const { backgroundUrl, currentUser, adminSessionId, adminUrl, isAdminView } = this.state
    if (!currentUser) return null

    return (
      <View style={s.flex}>
        {this.state.isLoggedIn ? (
          <View style={{ flex: 1 }}>
            <TitleBar title={t('trivia')} client={client} signin={this.signin} />
            <ImageBackground style={s.container} source={this.renderBackground()}>
              {isAdminView && adminSessionId && (
                <TouchableOpacity style={s.option} onPress={this.cancelGame}>
                  <Text style={s.optionText}>{t('cancelGame')}</Text>
                </TouchableOpacity>
              )}
              {this.renderCoreView()}
            </ImageBackground>
          </View>
        ) : (
          <LoadingView logInFailed={this.state.logInFailed} />
        )}
      </View>
    )
  }

  renderBackground = () => {
    const { backgroundUrl } = this.state
    if (this.state.isAdminView === false) {
      if (backgroundUrl) {
        return { uri: backgroundUrl }
      }
      return background
    }
  }

  renderCoreView = () => {
    const { currentUser, sessionId, sessions, me, isAdminView } = this.state
    if (!currentUser) return null
    const session = sessions[sessionId]
    const meJoined = me && me.sessionId === sessionId ? me : null
    if (isAdminView === undefined) {
      return this.renderSelectView()
    }
    if (isAdminView === true) {
      return this.renderAdmin()
    }
    return (
      <ScrollView style={s.scroll}>
        {me === undefined
          ? null
          : session
          ? this.renderSession(session, sessionId, meJoined)
          : this.renderSessions(sessions, me)}
      </ScrollView>
    )
  }

  renderSelectView = () => (
    <View style={s.scroll}>
      <Text style={s.titleText}>{t('information')}</Text>
      <View style={s.boxLeft}>
        <Text style={s.desText}>{t('infoDets')}</Text>
        <TouchableOpacity
          style={s.selectClear}
          onPress={() => this.setState({ isAdminView: false })}
        >
          <Text style={[s.tealTextBold, { color: this.state.primaryColor }]}>
            {t('playerView')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.selectClear}
          onPress={() => this.setState({ isAdminView: true })}
        >
          <Text style={[s.tealTextBold, { color: this.state.primaryColor }]}>{t('adminView')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  renderAdmin = () => {
    const { adminSessionId, adminSessions, me, adminUrl, adminSessionName } = this.state
    if (adminSessionId) {
      return <Admin url={adminUrl} sessionId={adminSessionId} sessionName={adminSessionName} />
    }
    return <View style={s.scroll}>{this.renderAdminSessions(adminSessions, me)}</View>
  }

  renderSession = (session, sessionId, meJoined) => {
    if (!meJoined) return this.renderNotJoined(session)

    switch (session.state) {
      case 'NOT_STARTED':
        return this.renderNotStartedSession(session)
      case 'QUESTION_OPEN':
        return this.renderAcceptingAnswers(session, sessionId)
      case 'QUESTION_CLOSED':
        return this.renderQuestionFinished(session, sessionId)
      case 'LEADERBOARD':
        return this.renderLeaderboard(session)
      case 'ENDED':
        return this.renderEndedSession(session)
      default:
        return null
    }
  }

  renderNotJoined = session => (
    <View style={s.notJoined}>
      <Text style={s.whiteTitle}>{t('triviaCap')}</Text>
      <Image source={trophy} style={s.trophy} />
      <Text style={s.whiteTitle}>{t('challengeCap')}</Text>
      <Text style={s.joinSessionName}>{session.name}</Text>
      <Button title={t('letsPlay')} onPress={this.join} />
    </View>
  )

  renderAdminSessions = (sessions, me) => {
    const currentSessions = Object.keys(sessions)
      .map(id => ({ ...sessions[id], id }))
      .filter(s => s.name.trim().length || (me && s.id === me.sessionIds))

    if (currentSessions.length === 0)
      return (
        <View style={s.scrollView}>
          <Text>{t('noGames')}</Text>
        </View>
      )
    return (
      <View style={{ flex: 1, display: 'flex' }}>
        <View style={{ marginLeft: 10, marginBottom: 15 }}>
          <Text style={s.titleText}>{t('games')}</Text>
          <Text style={s.desText}>{t('startManage')}</Text>
        </View>
        <ScrollView style={{ flex: 1, display: 'flex' }}>
          {currentSessions.map(session => (
            <View key={session.id} style={s.boxLeft}>
              <Text style={s.cellTitleText}>{session.name}</Text>
              <TouchableOpacity style={s.selectClear} onPress={this.selectSession(session)}>
                <Text style={[s.tealTextBold, { color: this.state.primaryColor }]}>
                  {t('manage')}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <View style={[s.boxLeft, s.bottom]}>
          <Text style={s.titleText}>{t('important')}</Text>
          <Text style={s.desText}>{t('importantInt')}</Text>
        </View>
      </View>
    )
  }

  renderSessions = (sessions, me) => {
    const currentSessions = Object.keys(sessions)
      .map(id => ({ ...sessions[id], id }))
      .filter(s => (s.name.trim().length && s.state !== 'ENDED') || (me && s.id === me.sessionIds))

    if (currentSessions.length === 0)
      return (
        <View style={s.box}>
          <Text>{t('noGames')}</Text>
        </View>
      )
    return (
      <View style={s.box}>
        <Text style={s.tealText}>{t('choose')}</Text>
        {currentSessions.map(s => (
          <Button key={s.id} title={s.name} onPress={this.selectSession(s)} />
        ))}
      </View>
    )
  }

  renderNotStartedSession = session => {
    const { users, sessionId } = this.state
    const joined = Object.values(users).filter(u => u.sessionId === sessionId)
    return (
      <View style={s.box}>
        <Text style={s.youAreIn}>{t('youIn')}</Text>
        <Text style={s.joinCount}>{joined.length - 1}</Text>
        <Text style={s.haveJoined}>{joined.length === 2 ? t('other') : t('others')}</Text>
        {joined.slice(Math.max(0, joined.length - numJoinedToShow)).map((u, i) => (
          <View key={u.id} style={[s.joinedUser, i === 0 ? { opacity: 0.5 } : null]}>
            <Avatar user={u} size={30} />
            <Text style={s.joinedUserName}>
              {u.firstName} {u.lastName}
            </Text>
            <Text style={s.hasJoined}>{t('hasJoined')}</Text>
          </View>
        ))}
      </View>
    )
  }

  renderAcceptingAnswers = (session, sessionId) => (
    <Question
      question={session.question}
      totalSeconds={session.question.totalSeconds}
      countDown
      selectedIndex={(this.state.answers[sessionId] || {}).answer}
      onOptionSelected={this.selectOption}
    />
  )

  renderQuestionFinished = (session, sessionId) => (
    <Question
      question={session.question}
      totalSeconds={0}
      selectedIndex={this.state.answers[sessionId]}
    />
  )

  renderLeaderboard = session => {
    const leaderboard = session.leaderboard || []
    const myPlace = this.myPlace(leaderboard)
    return (
      <View>
        {myPlace && (
          <View style={[s.box, s.myPlace]}>
            <Text style={s.myPlaceTitle}>
              {t('currentPlace', { place: ordinal(myPlace), punctuation: myPlace < 10 ? '!' : '' })}
            </Text>
          </View>
        )}
        <Text style={s.leaderboardHeader}>{t('leaderboard')}</Text>
        <Leaderboard leaderboard={leaderboard} />
      </View>
    )
  }

  renderEndedSession = session => {
    const leaderboard = session.leaderboard || []
    const myPlace = this.myPlace(leaderboard)
    return (
      <View>
        {myPlace && (
          <View style={[s.box, s.myPlace]}>
            <Text style={s.myPlaceTitle}>
              {t('placed', { place: ordinal(myPlace) })}
              {myPlace < 10 ? '!' : ''}
            </Text>
          </View>
        )}
        <Text style={s.leaderboardHeader}>{t('leaderboard')}</Text>
        <Leaderboard leaderboard={leaderboard} />
      </View>
    )
  }

  answersRef = () => this.props.fbc.database.private.adminableUserRef()
  sessionsRef = () => this.props.fbc.database.public.adminRef('sessions')
  adminSessionsRef = () => this.props.fbc.database.private.adminRef('sessions')
  adminRef = () => this.props.fbc.database.public.adminRef('sessions')
  userRef = () => this.props.fbc.database.public.userRef()
  usersRef = () => this.props.fbc.database.public.usersRef()
  backgroundUrlRef = () => this.props.fbc.database.public.adminRef('backgroundUrl')


  join = () => this.userRef().set({ ...this.state.currentUser, sessionId: this.state.sessionId })

  selectSession = session => () =>
    this.setState({
      sessionId: session.id,
      sessionName: session.name,
      adminSessionId: session.id,
      adminSessionName: session.name,
    })

  selectOption = i => {
    const { sessions, sessionId } = this.state
    const session = sessions[sessionId]
    const { question } = session
    this.answersRef().update({ [sessionId]: {answer: i, time:  firebase.database.ServerValue.TIMESTAMP}})
    this.answersRef().child("responses").child(sessionId).child(question.id).set(question.options[i])
  }

  myPlace = leaderboard =>
    (leaderboard.find(x => x.user.id === this.state.currentUser.id) || {}).place
}

function ordinal(x) {
  let ord
  if (x >= 4 && x <= 20) ord = 'th'
  else if (x % 10 === 1) ord = 'st'
  else if (x % 10 === 2) ord = 'nd'
  else if (x % 10 === 3) ord = 'rd'
  else ord = 'th'
  return `${x}${ord}`
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  option: {
    height: 44,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderColor: '#DEDEDE',
    borderBottomWidth: 1,
    backgroundColor: 'white',
  },
  select: {
    borderRadius: 25,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 15,
    borderColor: colors.teal,
    borderWidth: 2,
    backgroundColor: colors.teal,
  },
  selectClear: {
    backgroundColor: 'white',
    marginTop: 20,
  },
  desText: {
    fontSize: 18,
    color: '#364347',
  },
  titleText: {
    marginBottom: 5,
    fontSize: 28,
    fontWeight: '600',
    color: '#364347',
  },
  cellTitleText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#364347',
  },
  selectText: {
    color: 'white',
    fontSize: 18,
  },
  optionText: {
    color: '#364347',
    fontSize: 16,
  },
  box: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  boxLeft: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  bottom: {
    marginBottom: 50,
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
    color: colors.teal,
    fontSize: 20,
    backgroundColor: 'transparent',
  },
  tealTextBold: {
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'transparent',
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
  myPlace: {
    marginBottom: 30,
    backgroundColor: '#fff',
  },
  leaderboardHeader: {
    color: '#fff',
    marginBottom: 5,
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  myPlaceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.purple,
  },
  youAreIn: {
    color: colors.orange,
    fontSize: 16,
  },
  joinCount: {
    color: colors.teal,
    fontSize: 100,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  haveJoined: {
    color: colors.purple,
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
    color: colors.purple,
  },
  hasJoined: {
    fontSize: 16,
    color: colors.purple,
  },
})

export default provideFirebaseConnectorToReactComponent(
  client,
  'trivia',
  (props, fbc) => <HomeView {...props} fbc={fbc} />,
  PureComponent,
)
