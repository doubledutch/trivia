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

export default class Question extends PureComponent {
  state = {}

  componentDidMount() {
    this.setState({ secondsLeft: this.props.totalSeconds })
    this.props.countDown && this.startTimer(this.props)
  }

  startTimer(props) {
    const { totalSeconds } = props
    const start = new Date().valueOf()
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      const now = new Date().valueOf()
      const elapsedSeconds = (now - start) / 1000
      if (elapsedSeconds > totalSeconds) {
        clearInterval(this.timer)
      }
      this.setState({ secondsLeft: Math.max(0, totalSeconds - elapsedSeconds) })
    }, 500)
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.totalSeconds !== nextProps.totalSeconds ||
      (this.props.countDown && !nextProps.countDown)
    ) {
      this.setState({ secondsLeft: nextProps.totalSeconds })
      if (this.timer) clearInterval(this.timer)
    }

    if (
      nextProps.countDown &&
      (this.props.question !== nextProps.question ||
        this.props.totalSeconds !== nextProps.totalSeconds)
    ) {
      this.startTimer(nextProps)
    }
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  render() {
    const { children, question, number, totalSeconds } = this.props
    const { secondsLeft } = this.state
    return (
      <div className="box">
        <div className="box-content">
          <div className="question-title">
            <div>{t('question', { num: number })}</div>
            <div className={secondsLeft === 0 ? 'time-up' : null}>
              {secondsLeft != null && durationString(secondsLeft)}
            </div>
          </div>
        </div>
        <TimerBar
          ratio={totalSeconds ? secondsLeft / totalSeconds : 0}
          shortTime={secondsLeft <= 10}
        />
        <div className="box-content">
          <h2>{question.text}</h2>
          {children}
        </div>
      </div>
    )
  }
}

export const TimerBar = ({ ratio, shortTime }) => (
  <div className="timer-bar">
    <div
      className={shortTime ? 'timer-bar-remaining-short' : 'timer-bar-remaining'}
      style={{ width: `${ratio * 100}%` }}
    />
  </div>
)

function durationString(seconds) {
  const s = Math.ceil(seconds)
  const sRem = s % 60
  const m = Math.floor(s / 60)
  return `${m}:${sRem < 10 ? '0' : ''}${sRem}`
}
