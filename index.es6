import React from 'react';
/* eslint-disable id-match */
import { findDOMNode as findDomNode } from 'react-dom';
/* eslint-enable id-match */
import { getClosestDppx } from './get-dppx';
import { addElementResizeListener, removeElementResizeListener } from './element-resize-listener';
export default class Picture extends React.Component {

  defaultProps = {
    alt: '',
    sources: [],
  }

  constructor({ sources }) {
    super(...arguments);
    this.changeImageByWidth = this.changeImageByWidth.bind(this);
    const dppx = getClosestDppx(sources);
    const smallPortraitSource = sources.reduce((previousSource, currentSource) => {
      if (currentSource.dppx !== dppx) {
        return previousSource;
      }
      const portraitImageRatioCutoff = 2;
      const isLessWide = currentSource.width < previousSource.width;
      const currentImageRatio = Math.abs(currentSource.width / currentSource.height);
      const isPortrait = currentImageRatio < portraitImageRatioCutoff;
      return isLessWide && isPortrait ? currentSource : previousSource;
    }, sources[0] || {});
    this.state = {
      ...smallPortraitSource,
    };
  }

  componentDidMount() {
    const element = findDomNode(this);
    addElementResizeListener(element, this.changeImageByWidth);
    this.changeImageByWidth(element.offsetWidth, element.offsetHeight);
  }

  componentWillUnmount() {
    removeElementResizeListener(findDomNode(this), this.changeImageByWidth);
  }

  changeImageByWidth(width, height) {
    const { dppx } = this.state;
    const bestFitImage = this.props.sources.reduce((leftSource, rightSource) => {
      if (Math.abs(rightSource.dppx - dppx) < Math.abs(leftSource.dppx - dppx)) {
        return rightSource;
      }
      const rightSourceWidthDelta = Math.abs(rightSource.width - width);
      const leftSourceWidthDelta = Math.abs(leftSource.width - width);
      if (rightSourceWidthDelta === leftSourceWidthDelta) {
        const rightSourceHeightDelta = Math.abs(rightSource.height - height);
        const leftSourceHeightDelta = Math.abs(leftSource.height - height);
        return (rightSourceHeightDelta < leftSourceHeightDelta) ? rightSource : leftSource;
      }
      return (rightSourceWidthDelta < leftSourceWidthDelta) ? rightSource : leftSource;
    }, this.props.sources[0]);
    this.setState(bestFitImage);
  }

  render() {
    const { url } = this.state || {};
    const { sources, className, alt, ...remainingProps } = this.props;
    const imageProps = { alt, src: url };
    const wrapperProps = {
      ...remainingProps,
      className: [ 'picture' ].concat(className).join(' ').trim(),
    };
    return (
      <div {...wrapperProps}>
        <img {...imageProps}/>
      </div>
    );
  }
}

if (process.env.NODE_ENV !== 'production') {
  Picture.propTypes = {
    className: React.PropTypes.string,
    alt: React.PropTypes.string.isRequired,
    sources: React.PropTypes.arrayOf(React.PropTypes.shape({
      url: React.PropTypes.string.isRequired,
      width: React.PropTypes.number.isRequired,
      height: React.PropTypes.number.isRequired,
      dppx: React.PropTypes.number.isRequired,
    })).isRequired,
  };
}
