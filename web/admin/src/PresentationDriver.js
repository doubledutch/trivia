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
import { translate as t } from '@doubledutch/admin-client'
import './PresentationDriver.css'
import firebase from 'firebase/app'

import Question from './Question'

export default class PresentationDriver extends PureComponent {
  publicSessionRef = () =>
    this.props.fbc.database.public.adminRef('sessions').child(this.props.session.id)

  publicUsersRef = () => this.props.fbc.database.public.usersRef()

  privateUsersRef = () => this.props.fbc.database.private.adminableUsersRef()

  state = {}

  componentDidUpdate(prevProps) {
    if (prevProps.session.id !== this.props.session.id) {
      this.unwireHandlers()
      this.wireHandlers()

      const { publicSession } = this.state
      if (!this.timer && publicSession && publicSession.state === 'QUESTION_OPEN') this.startTimer()
    }
  }

  componentDidMount() {
    this.wireHandlers()
  }

  componentWillUnmount() {
    this.unwireHandlers()
  }

  wireHandlers() {
    this.publicSessionHandlerRef = this.publicSessionRef()
    this.publicSessionHandler = this.publicSessionHandlerRef.on('value', data =>
      this.setState({ publicSession: data.val() }),
    )
  }

  unwireHandlers() {
    this.publicSessionHandlerRef.off('value', this.publicSessionHandler)
    this.clearTimer()
  }

  className = () => `presentation-driver ${this.props.className}`

  render() {
    const { session } = this.props
    const { publicSession } = this.state
    const isDisabled =
      this.props.questions.length === 0
        ? true
        : this.props.questions.length === 1 && this.props.questions[0].text === ''
    if (!session || !publicSession)
      return (
        <div className={this.className()}>
          <div className="session-title-box">
            <p className="session-title">{session.name}</p>
          </div>
          <button
            className="wide-button"
            onClick={this.initializeSession}
            disabled={isDisabled}
            type="button"
          >
            {t('init')}
          </button>
        </div>
      )

    switch (publicSession.state) {
      case 'NOT_STARTED':
        return this.renderNextQuestion(session, 0, false)
      case 'QUESTION_OPEN':
        return this.renderNextQuestion(session, publicSession.question.index + 1, true)
      case 'QUESTION_CLOSED':
        return this.renderNextQuestion(session, publicSession.question.index + 1, false)
      case 'LEADERBOARD':
        return this.renderNextQuestion(session, publicSession.question.index + 1, false, true)
      default:
        return <div className={this.className()}>{this.renderReset()}</div>
    }
  }

  renderNextQuestion(session, questionIndex, isQuestionInProgress, hideLeaderboardButton) {
    const { questions } = this.props
    const question = questions[questionIndex]

    return (
      <div className={this.className()}>
        {question && (
          <Question
            question={question}
            number={questionIndex + 1}
            totalSeconds={session.secondsPerQuestion}
          >
            <button onClick={this.startNextQuestion} disabled={isQuestionInProgress}>
              {t('start')}
            </button>
          </Question>
        )}
        {isQuestionInProgress ? (
          <div className="buttons">
            <button className="wide-button" onClick={this.endQuestion}>
              {t('endEarly')}
            </button>
            <button className="wide-button" disabled onClick={this.showLeaderboard}>
              {t('display')}
            </button>
          </div>
        ) : (
          questionIndex > 0 && (
            <div className="buttons">
              {!hideLeaderboardButton && (
                <button className="wide-button" onClick={this.showLeaderboard}>
                  {t('display')}
                </button>
              )}
              <button className="wide-button" onClick={this.endGame}>
                {t('end')}
              </button>
            </div>
          )
        )}
        {this.renderReset()}
      </div>
    )
  }

  renderReset = () => (
    <button className="wide-button" onClick={this.resetSession}>
      {t('reset')}
    </button>
  )

  clearTimer = () => {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  resetSession = () => {
    if (window.confirm(t('confirmReset'))) {
      this.clearTimer()

      // Remove the trivia session
      this.publicSessionRef().remove()

      // Remove users who were in the removed trivia session.
      this.publicUsersRef().once('value', data => {
        const users = data.val() || {}
        Object.keys(users)
          .filter(id => users[id].sessionId === this.props.session.id)
          .forEach(id => {
            this.publicUsersRef()
              .child(id)
              .remove()

            // remove the saved response data
            this.privateUsersRef()
              .child(id)
              .child('responses')
              .child(this.props.session.id)
              .remove()
          })
      })
    }
  }

  initializeSession = () => {
    this.publicSessionRef().set({ state: 'NOT_STARTED', name: this.props.session.name })
  }

  startNextQuestion = () => {
    const { session, questions } = this.props
    const { publicSession } = this.state
    const index = publicSession.question ? publicSession.question.index + 1 : 0
    const question = questions[index]
    if (this.props.saveCurrentIndex) this.props.saveCurrentIndex(index)
    if (this.timer) clearInterval(this.timer)

    this.publicSessionRef()
      .update({
        state: 'QUESTION_OPEN',
        question: {
          index,
          text: question.text,
          totalSeconds: session.secondsPerQuestion,
          options: question.options,
          startTime: firebase.database.ServerValue.TIMESTAMP,
          id: question.id,
        },
      })
      .then(() => {
        this.startTimer()
      })
  }

  showLeaderboard = () => this.publicSessionRef().update({ state: 'LEADERBOARD' })

  endGame = () => {
    this.publicSessionRef().update({ state: 'ENDED' })
  }

  endQuestion = () => {
    if (!this.timer) return // Ensure we only end the question once.
    this.clearTimer()
    const { questions, session } = this.props
    const { publicSession } = this.state
    if (publicSession.state === 'QUESTION_OPEN') {
      const { question } = publicSession

      // Score responses
      this.privateUsersRef().once('value', data => {
        const answersPerUser = data.val() || {}
        const answers = Object.keys(answersPerUser)
          .filter(id => answersPerUser[id][session.id] != null)
          .map(id => ({
            id,
            answer: answersPerUser[id][session.id].answer || 0,
            time: answersPerUser[id][session.id].time || 0,
          }))
        const guesses = answers.reduce(
          (counts, answer) => {
            counts[answer.answer]++
            return counts
          },
          [0, 0, 0, 0],
        )

        // Score
        const correctIndex = questions[question.index].correctIndex

        // get publicSession start time
        const startTime = this.state.publicSession.question.startTime

        const scores = answers.reduce((scores, answer) => {
          if (!scores[answer.id]) {
            scores[answer.id] = { score: 0, time: 0 }
          }
          if (answer.answer === correctIndex) {
            scores[answer.id].score = scores[answer.id].score + 1
            const newTime = answer.time - startTime
            const currentTime = scores[answer.id].time || 0
            scores[answer.id].time = currentTime + newTime
          }
          return scores
        }, publicSession.scores || {})

        // Close the question and show responses
        this.publicSessionRef().update({
          state: 'QUESTION_CLOSED',
          scores,
          leaderboard: this.getLeaderboard(scores),
          question: {
            index: question.index,
            text: question.text,
            options: question.options,
            correctIndex,
            startTime: question.startTime,
            guesses,
            id: question.id,
            totalGuesses: guesses[0] + guesses[1] + guesses[2] + guesses[3],
          },
        })

        // Remove all player responses now that scoring is complete.
        answers.forEach(a =>
          this.privateUsersRef()
            .child(a.id)
            .child(session.id)
            .remove(),
        )
      })
    }
  }

  getLeaderboard(scores) {
    if (!scores) return []
    const { users, session } = this.props
    let prevScore = Number.MAX_SAFE_INTEGER
    let prevTime = -1
    let place = 0
    const leaderboard = Object.keys(scores)
      .map(userId => ({
        score: scores[userId].score || 0,
        user: users[userId],
        time: scores[userId].time || 0,
      }))
      .filter(x => x.user)
      .sort(sortUsers) // Sort by descending score and break ties with ascending avg answer time
    leaderboard.forEach((playerScore, index) => {
      if (playerScore.score < prevScore || playerScore.time > prevTime) {
        place = index + 1
      }
      playerScore.place = place
      prevScore = playerScore.score
      prevTime = playerScore.time
    })
    return session.leaderboardMax
      ? leaderboard.filter(p => p.place <= session.leaderboardMax)
      : leaderboard
  }

  startTimer() {
    this.questionStartedAt = new Date().valueOf()
    this.clearTimer()
    this.timer = setInterval(() => {
      const { publicSession } = this.state
      if (!publicSession || !publicSession.question) return
      const timeLeft =
        publicSession.question.totalSeconds - (new Date().valueOf() - this.questionStartedAt) / 1000
      if (timeLeft < 0) {
        this.endQuestion()
      }
    }, 500)
  }
}

function sortUsers(a, b) {
  if (a.score !== b.score) return b.score - a.score
  return a.time - b.time
}
