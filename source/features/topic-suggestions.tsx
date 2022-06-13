import * as pageDetect from 'github-url-detection';
import React from 'react';
import features from '.';
import * as api from '../github-helpers/api';



function addTopicSuggestions(topics: Array<string>):void {
	let metadata_container = document.getElementById("repo_metadata_form")
	if (metadata_container == null){
		return
	}
	
	let suggestions = <div className="width-full d-inline-block">
	<div className="js-tag-input-wrapper">
	  <div className="form-group my-0">
		<div className="mb-2">
		  <label for="repo_topics" className="d-block">Topics suggestions <span className="text-normal color-fg-muted">(based on use in organization or user)</span></label>
		</div>
		<div className="tag-input form-control d-inline-block color-bg-default py-0 position-relative">
		  <ul className="js-tag-input-selected-tags d-inline">
			<li className="d-none topic-tag-action my-1 mr-1 f6 float-left js-tag-input-tag js-template">
			  <span className="js-placeholder-tag-name"></span>
			  <button type="button" className="delete-topic-button f5 no-underline ml-1 js-remove" tabIndex={-1}>
				<svg aria-label="Remove topic" role="img" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-x">
					<path fill-rule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
				</svg>
			  </button>
			  <input type="hidden" name="repo_topics[]" className="js-topic-input" value=""/>
			</li>
		  </ul>
		</div>
	  </div>
	</div>
  </div>
	
	let sidebar_options = document.getElementById("hidden_sidebar_options")?.parentElement
	if (sidebar_options == null || sidebar_options == undefined){
		return
	}
	console.log("inserting")
	console.log(sidebar_options)
	console.log(suggestions)
	console.log(metadata_container)
	metadata_container.insertBefore(suggestions, sidebar_options)
}



// async function checkUser(user: string): Promise<boolean> {
// 	return api.v4(`
// 	user (login: "${user}"){
// 		id
// 	}
// 	`).then((result) => {
// 		console.log(result)
// 		if(result.user.id){
// 			return true
// 		}
// 		return false
// 	}).catch((res) => {
// 		console.log(res)
// 		return false
// 	})
	
// }

async function checkOrg(org: string): Promise<boolean>{
	return api.v4(`
	organization (login: "${org}"){
		id
	}
	`).then((result) => {
		console.log(result)
		if(result.organization.id){
			return true
		}
		return false
	}).catch((res) => {
		console.log(res)
		return false
	})
}

async function getData(org: string, is_org: boolean = true, after?: string): Promise<Set<string>>{
	let header = (is_org) ? `organization(login:\"${org}\") {` : `user (login: \"${org}\") {`
	
	let str = `
		${header}
		repositories (${after ? "first:100 after:\"" + after + "\"": "first:100"}) {
			totalCount
			pageInfo {
				endCursor
				hasNextPage
			}
			nodes{
			name
			repositoryTopics(first:100) {
				edges {
				node {
					topic {
						name
					}
				}
			}
			}
			}
		}
		}
	`
	
	let result = await api.v4(str)
	let topics = new Set<string>()
	let owner = (is_org) ? "organization" : "user";
	result[owner].repositories.nodes.forEach((repo: any) => {
		repo["repositoryTopics"]["edges"].forEach((node: any) => {
			topics.add(node["node"]["topic"]["name"])
		});
	});

	if(result[owner].repositories.pageInfo.hasNextPage){
		topics = new Set([...topics, ...await getData(org, is_org, result[owner].repositories.pageInfo.endCursor)])
	}
	
	return topics
}

async function getTopics(owner: string): Promise<Set<string>>{
	return getData(owner, await checkOrg(owner))
}


function init(): void {
	let d = Node.prototype.dispatchEvent;
	Node.prototype.dispatchEvent = function (...a) {
		console.log(...a);
		// debugger; // Uncomment when necessary
		d.apply(this, a);
		return false
	}
	
	
	
	const owner = location.pathname.split('/')[1]
	getTopics(owner).then((topics) => {
		console.log(Array.from(topics).sort())
		addTopicSuggestions(Array.from(topics).sort())
	})
}

void features.add(import.meta.url, {
	include: [
		pageDetect.isRepoHome, // Find which one you need on https://fregante.github.io/github-url-detection/
	],
	init
});