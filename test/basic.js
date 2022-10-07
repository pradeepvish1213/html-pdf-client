import htmlPdfClient from "../src";

describe('creation', function () {
  it('html2pdf should exist', function () {
    expect(window.htmlPdfClient).to.exist;
  });
  it('html2pdf() should produce a thenable object', function () {
    expect(htmlPdfClient().then).to.be.a('function');
  });
  it('new html2pdf.Worker should produce a thenable object', function () {
    expect((new htmlPdfClient.Worker).then).to.be.a('function');
  });
});
