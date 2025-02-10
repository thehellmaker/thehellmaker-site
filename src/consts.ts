// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Akash Ashok';
export const SITE_DESCRIPTION = 'Welcome to my website!';

export class User {
    constructor(
        public id: string,
        public name: string,
        public email: string,
        public image: string,
        public bio: string,
        public twitter: string,
        public github: string,
        public website: string,
    ) {
        this.name = name;
        this.email = email;
        this.image = image;
        this.bio = bio;
        this.twitter = twitter;
        this.github = github;
        this.website = website;
    }
}

export const users: Map<string, User> = new Map();
users.set('thehellmaker', new User(
    'thehellmaker', 
    'Akash Ashok', 
    'thehellmaker@gmail.com', 
    '/ironman.jpg', 
    'I am a software engineer', 
    'https://twitter.com/thehellmaker', 
    'https://github.com/thehellmaker', 
    'https://thehellmaker.com'
));