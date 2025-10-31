// Example service that uses models
const models = require('../models');

// Example: MemberService
const MemberService = {
    create: (data) => {
        // Use prepared statements from models.members
        // const info = models.members.s1.run({...});
        throw new Error('Implement service methods based on your app logic');
    }
};

module.exports = { MemberService };
