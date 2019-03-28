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
import './BigScreen.css'
import { translate as t } from '@doubledutch/admin-client'
import Avatar from './components/Avatar'
import Question from './Question'

const numJoinedToShow = 7
export default class BigScreen extends PureComponent {
  state = { joined: [] }

  componentDidMount() {
    const { sessionId } = this.props
    this.backgroundUrlRef().on('value', data => this.setState({ backgroundUrl: data.val() }))
    this.sessionRef().on('value', data => this.setState({ session: data.val() }))
    this.usersRef().on('child_added', data => {
      const user = data.val()
      if (user.sessionId === sessionId) {
        this.setState(state => ({ joined: [...state.joined, { ...user, id: data.key }] }))
      }
    })
    const removeJoinedUser = data =>
      this.setState(state => ({ joined: state.joined.filter(u => u.id !== data.key) }))
    this.usersRef().on(
      'child_changed',
      data => data.val().sessionId !== sessionId && removeJoinedUser(data),
    )
    this.usersRef().on('child_removed', removeJoinedUser)
  }

  render() {
    const { backgroundUrl, session } = this.state
    const { className } = this.props
    if (session === undefined) return <div>Loading...</div>
    if (!session) return this.renderNonexistent()
    return (
      <div
        className={`big-screen ${className}`}
        style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : null}
      >
        {this.renderState(session)}
      </div>
    )
  }

  renderState(session) {
    switch (session.state) {
      case 'NOT_STARTED':
        return this.renderNotStarted()
      case 'QUESTION_OPEN':
        return this.renderOpenQuestion(session)
      case 'QUESTION_CLOSED':
        return this.renderClosedQuestion(session)
      case 'LEADERBOARD':
      case 'ENDED':
        return this.renderLeaderboard(session)
      default:
        return null
    }
  }

  renderNonexistent = () => (
    <div
      style={
        this.state.backgroundUrl ? { backgroundImage: `url(${this.state.backgroundUrl})` } : null
      }
      className="big-screen"
    >
      <div className="box box-content">{t('initialize')}</div>
    </div>
  )

  renderNotStarted() {
    const { joined } = this.state
    if (joined.length === 0) {
      return (
        <div className="box joined">
          <div className="box-content">
            <h1>{t('waiting')}</h1>
            <h2>{t('toJoin')}</h2>
          </div>
        </div>
      )
    }

    return (
      <div className="box joined">
        <div className="box-content">
          <h1>{joined.length}</h1>
          <h2>{joined.length > 1 ? 'Have' : 'Has'} Joined</h2>
          <div className="attendees-joined">
            {joined.slice(Math.max(0, joined.length - numJoinedToShow)).map((u, i) => (
              <div key={u.id}>
                <Avatar user={u} size={7} units="vh" />
                <span>
                  {u.firstName} {u.lastName}
                </span>
                &nbsp;{t('hasJoined')}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  renderOpenQuestion(session) {
    const { question } = session
    return (
      <Question
        question={question}
        number={question.index + 1}
        totalSeconds={question.totalSeconds}
        countDown
      >
        {question.options.map((opt, i) => !!opt && <Option key={i} text={opt} />)}
      </Question>
    )
  }

  renderClosedQuestion(session) {
    const { question } = session
    return (
      <Question question={question} number={question.index + 1} totalSeconds={0}>
        {question.options.map(
          (opt, i) =>
            !!opt && (
              <Option
                key={i}
                text={opt}
                guesses={question.guesses[i]}
                totalGuesses={question.totalGuesses}
                correct={i === question.correctIndex}
              />
            ),
        )}
      </Question>
    )
  }

  renderLeaderboard(session) {
    const { leaderboard } = session
    const customStyle = p =>
      p.place === 1
        ? {
            transform: 'scale(1.5)',
            margin: '7vh auto',
          }
        : null
    return (
      <div className="leaderboard">
        <h1>{t('leaderboard')}</h1>
        {leaderboard &&
          leaderboard.map((p, i) => (
            <div key={i} className="leaderboard-tile box" style={customStyle(p)}>
              <div className="leaderboard-place">{p.place}</div>
              <Avatar user={p.user} size={5} units="vh" />
              <div className="leaderboard-name">
                {p.user.firstName} {p.user.lastName}
              </div>
              <div className="leaderboard-points">
                {p.score} {p.score === 1 ? 'pt' : 'pts'}
                <p className="leaderboard-time">
                  Avg {p.time ? (p.time / p.score / 1000) * -1 : 0} s
                </p>
              </div>
            </div>
          ))}
      </div>
    )
  }

  sessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(this.props.sessionId)

  backgroundUrlRef = () => this.props.fbc.database.public.adminRef('backgroundUrl')

  usersRef = () => this.props.fbc.database.public.usersRef()
}

const Option = ({ text, correct, guesses, totalGuesses }) => (
  <div className={`option ${correct ? 'correct' : ''}`}>
    <div className="option-text-back">
      <span>{text}</span>
      <span>{guesses != null && guesses}</span>
    </div>
    {guesses != null ? (
      <div className="option-overlay">
        <div style={{ width: `${(guesses / totalGuesses) * 100}%` }}>
          <div className="option-text-front">
            <span>{text}</span>
            <span>{guesses != null && guesses}</span>
          </div>
        </div>
      </div>
    ) : null}
  </div>
)
