// ********************** Initialize server **********************************
const server = require('../src/index.js'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
// Ben's TestCases 
describe('Testing Register API', () => {
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'ben', password: 'benpassword'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });
  it('Negative : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({name: 10, password: "password"})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Fail');
        done();
      });
  });
});





// ********************************************************************************
// Jevan's Testcases 





// ********************************************************************************
// Treyanna's Test Cases 






// ********************************************************************************
// Juliana's Test Cases 










// ********************************************************************************
// Chandler's Test Cases 







// ********************************************************************************
// Jonny's Test Cases 






// ********************************************************************************
