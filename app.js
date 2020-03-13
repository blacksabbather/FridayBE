const express = require('express');
const graphql = require('graphql');
const graphqlHTTP = require('express-graphql');
const app = express();
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

const mongoURI = 'mongodb://localhost:27017/FridayDevDB'
var conn = mongoose.createConnection(mongoURI);
const Schema = mongoose.Schema;
const templateSchema = new Schema({
    name: String,
    content: String,
    authorID: String
});
Template = conn.model('Template',templateSchema);
const authorSchema = new Schema({
    NTID: String
});

Author = conn.model('Author', authorSchema);

const { 
    GraphQLObjectType, GraphQLString, 
    GraphQLID, GraphQLInt,GraphQLSchema, 
    GraphQLList,GraphQLNonNull 
} = graphql;

const TemplateType = new GraphQLObjectType({
    name:"TT",
    fields: () => ({
        _id: { type: GraphQLID }, 
        name: { type: GraphQLString }, 
        content:{ type: GraphQLString },
	authorID: { type: GraphQLString }
    })
});

const AuthorType = new GraphQLObjectType({
    name: 'AT',
    fields: () => ({
        _id: { type: GraphQLID }, 
        NTID: { type: GraphQLString },
	templates:{
		type: new GraphQLList(TemplateType),
		resolve(parent, args){
			return Template.find({authorID: parent.NTID});
		}
	}
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        template: {
            type: TemplateType,
	    args: { id: { type: GraphQLID } },
            resolve(parent, args) {
		return Template.findById(args.id);
	    }
        },
	templates:{
            type: new GraphQLList(TemplateType),
            resolve(parent, args) {
                return Template.find({});
            }
        },
	author:{
            type: AuthorType,
            args: { NTID: { type: GraphQLID } },
            resolve(parent, args) {
                return Author.findOne({NTID:args.NTID});
            }
        },
        authors:{
            type: new GraphQLList(AuthorType),
            resolve(parent, args) {
                return Author.find({});
            }
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addAuthor: {
            type: AuthorType,
            args: {
                NTID: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                let author = new Author({
                    NTID: args.NTID,
                });
                return author.save();
            }
        },
        addTemplate:{
            type:TemplateType,
            args:{
                name: { type: new GraphQLNonNull(GraphQLString)},
                content: { type: new GraphQLNonNull(GraphQLString)},
                authorID: { type: new GraphQLNonNull(GraphQLString)}
            },
            resolve(parent,args){
                let template = new Template({
                    name:args.name,
                    content:args.content,
                    authorID:args.authorID
                });
                return template.save();
            }
        },
        updateTemplate:{
            type:TemplateType,
            args:{
                id: { type: new GraphQLNonNull(GraphQLID) },
                name: { type: GraphQLString },
                content: { type: GraphQLString },
                authorID: { type: GraphQLString }
            },
            resolve(parent,args){
                return Template.findByIdAndUpdate(args.id,args);
            }
        },
        delTemplate:{
            type:TemplateType,
            args:{
                id: { type: new GraphQLNonNull(GraphQLID)},
            },
            resolve(parent,args){
                return Template.findByIdAndDelete(args.id);
            }
        }
    }
});
/*
        updateTemplate:{
            type:TemplateType,
            args:{
                id: { type: new GraphQLNonNull(GraphQLID) },
                name: { type: GraphQLString },
                pages: { type: GraphQLInt },
                authorID: { type: GraphQLID }
            },
            resolve(parent,args){
                return Book.findOneAndUpdate({id:args.id},args);
            }
        },
        delBook:{
            type:BookType,
            args:{
                id: { type: new GraphQLNonNull(GraphQLID)},
            },
            resolve(parent,args){
                return Book.findOneAndDelete({id:args.id});
            }
        }
    }
*/

schema = new GraphQLSchema({
    query: RootQuery,
    mutation:Mutation
});

const cors=require('cors');
var corsOptions = {
  origin: function(origin, callback) {
	console.log(origin);
	callback(null, true);
  }
}
const corsHandler = cors(corsOptions);
app.use(corsHandler);
app.options("*", corsHandler);
var endpoint='FridayDB';
app.use('/'+endpoint, graphqlHTTP({
	schema,
	graphiql:true
}));

app.listen(3001, () => {
    console.log('Listening on http://10.176.8.17:3001/'+endpoint);
}); 
