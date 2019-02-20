/* eslint-disable no-useless-escape */
import React from 'react'
import { Button, Avatar, Modal, message, Radio } from 'antd'
import { markdown } from 'markdown'
import { isString, isObject, trim } from 'lodash'

import { isURL, getLocale, getLocaleLabel } from '../../utils'
import FormItem from '../../components/form-item'
import locales from '../../locales'
import './index.scss'

const config = require(process.env.path)

const RadioButton = Radio.Button
const RadioGroup = Radio.Group

const configKey = JSON.stringify(config.forms)

// 给 input 增加额外字段
Object.values(config.forms).forEach(form => {
  form.formItems.unshift({
    label: {
      zh: 'Issue 标题',
      en: 'Issue title'
    },
    type: 'title',
    required: true
  })
  form.formItems.forEach(inputItem => {
    inputItem.error = false
    inputItem.errorMsg = ''
    inputItem.value = ''
  })
})

export default class Index extends React.Component {
  constructor () {
    super(...arguments)
    const preForms = JSON.parse(localStorage.getItem(configKey))
    const forms = preForms || config.forms

    this.state = {
      issueMd: '',
      visible: false,
      issueType: 'bug',
      locale: getLocale(),
      forms
    }
  }

  getLocaleText (doc) {
    const { locale } = this.state
    if (isObject(doc)) {
      return doc[locale]
    }
    return doc
  }

  handleLocaleChange = () => {
    const { locale } = this.state
    this.setState({
      locale: locale === 'zh' ? 'en' : 'zh'
    })
  }

  getMdTitle (inputItem) {
    if (inputItem.mdTitle) {
      return inputItem.mdTitle
    } else if (isString(inputItem.label)) {
      return inputItem.label
    } else if (isObject(inputItem.label) && inputItem.label.en) {
      return inputItem.label.en
    }
    return inputItem.label.zh
  }

  getIssueTitle () {
    const { forms, issueType } = this.state
    return forms[issueType].formItems[0].value
  }

  handleValueChange (idx, event) {
    const { forms, issueType } = this.state
    forms[issueType].formItems[idx].value = event.target.value
    this.validForm(idx)
    this.saveData()
  }

  handelVisibleChange = () => {
    this.setState({ visible: false })
  }

  handleIssueTypeChange = event => {
    this.setState({ issueType: event.target.value })
    this.saveData()
  }

  saveData () {
    localStorage.setItem(configKey, JSON.stringify(this.state.forms))
  }

  validForm (idx) {
    const { forms, issueType } = this.state
    const item = forms[issueType].formItems[idx]
    if (item.required && !trim(item.value)) {
      item.error = true
      const errorMsg = this.getLocaleText(locales.requiredErrorMsg)
      item.errorMsg = errorMsg
    } else if (item.isLink && !isURL(trim(item.value))) {
      item.error = true
      const errorMsg = this.getLocaleText(locales.linkErrorMsg)
      item.errorMsg = errorMsg
    } else {
      item.error = false
      item.errorMsg = ''
    }
    this.setState({ forms })
  }

  handleBlur (idx) {
    this.validForm(idx)
  }

  handlePreview = () => {
    const { forms, issueType } = this.state
    const inputItems = forms[issueType].formItems
    let hasError = false
    inputItems.forEach(item => {
      if (item.required && !trim(item.value)) {
        item.error = true
        const errorMsg = this.getLocaleText(locales.requiredErrorMsg)
        item.errorMsg = errorMsg
        hasError = true
      } else if (item.isLink && !isURL(trim(item.value))) {
        item.error = true
        const errorMsg = this.getLocaleText(locales.linkErrorMsg)
        item.errorMsg = errorMsg
        hasError = true
      } else {
        item.error = false
        item.errorMsg = ''
      }
    })
    if (hasError) {
      const errorMsg = this.getLocaleText(locales.formErrorMsg)
      message.error(errorMsg)
      this.setState({ forms })
      return
    }
    const issueMd = inputItems.reduce((md, item) => {
      if (!item.isTitle) {
        const title = this.getMdTitle(item)
        return `${md}### ${title}\n\n${item.value}\n\n`
      }
      return md
    }, '')
    this.setState({
      issueMd,
      visible: true
    })
  }

  handleCreate = () => {
    const { issueMd } = this.state
    const issueTitle = this.getIssueTitle()
    const title = encodeURIComponent(issueTitle).replace(/%2B/gi, '+')
    const withMarker = `${issueMd}<!-- generated by issue-helper. DO NOT REMOVE -->`
    const body = encodeURIComponent(withMarker).replace(/%2B/gi, '+')

    localStorage.clear()
    this.setState({ visible: false })
    window.open(
      `https://github.com/${config.repo}/issues/new?title=${title}&body=${body}`
    )
  }

  render () {
    const { issueType, forms, issueMd, locale } = this.state

    return (
      <div className='page'>
        <Modal
          title={this.getLocaleText(locales.modalPreviewTitle)}
          width='1000px'
          visible={this.state.visible}
          onOk={this.handleCreate}
          onCancel={this.handelVisibleChange}
        >
          <div className='markdown' dangerouslySetInnerHTML={{ __html: markdown.toHTML(issueMd) }}></div>
        </Modal>
        {/* header */}
        <div className='issue-header'>
          <div className='issue-header__main'>
            <div>
              <Avatar size='large' src={config.logo} />
              <h1 className='issue-header__title'>{this.getLocaleText(config.title)}</h1>
            </div>
            <div>
              <Button onClick={this.handleLocaleChange} className='issue-header-btn' size='small'>{getLocaleLabel(locale)}</Button>
            </div>
          </div>
        </div>
        {/* header */}
        {/* main */}
        <div className='issue-main'>
          <h2>{this.getLocaleText(locales.readmeTitle)}</h2>
          <div className='issue-readme markdown' dangerouslySetInnerHTML={{ __html: markdown.toHTML(this.getLocaleText(config.readme)) }}></div>
          <h2>{this.getLocaleText(locales.fillFormTitle)}</h2>
          <div className='issue-form'>
            <div className='form-item'>
              <div className='form-item__label'>{this.getLocaleText(locales.issueTypeLabel)}:</div>
              <div className='form-item__input'>
                <RadioGroup onChange={this.handleIssueTypeChange} value={issueType}>
                  {forms.bug && <RadioButton value='bug'>{this.getLocaleText(forms.bug.title)}</RadioButton>}
                  {forms.feature && <RadioButton value='feature'>{this.getLocaleText(forms.feature.title)}</RadioButton>}
                </RadioGroup>
              </div>
            </div>
            {forms[issueType].formItems.map((item, i) => (
              <FormItem
                key={i}
                {...item}
                label={this.getLocaleText(item.label)}
                placeholder={this.getLocaleText(item.placeholder)}
                onBlur={this.handleBlur.bind(this, i)}
                onChange={this.handleValueChange.bind(this, i)}
              />
            ))}
            <div className='issue-preview'>
              <Button onClick={this.handlePreview} size='large' type='primary'>{this.getLocaleText(locales.previewBtnText)}</Button>
            </div>
          </div>
        </div>
        {/* main */}
        {/* footer */}
        <div className='issue-footer'> powered by <a href='https://github.com/jimczj/issue-helper' target='blank'>issue helper</a></div>
        {/* footer */}
      </div>
    )
  }
}
