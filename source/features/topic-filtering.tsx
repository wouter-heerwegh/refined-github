import * as pageDetect from 'github-url-detection';
import React from 'dom-chef';
import features from '.';
import * as api from '../github-helpers/api';

function addButton(): void {
	const type_button = document.getElementById("type-options")?.parentNode;
	console.log(type_button);
	if(type_button == null){
		return
	}

	let button = <details className="details-reset details-overlay position-relative mt-1 mt-lg-0 mr-md-2 ml-md-2" id="topic-options">
		<summary aria-haspopup="menu" data-view-component="true" className="btn" role="button">
			<span>Topic</span>
			<span className='dropdown-caret'/>
		</summary>
		<details-menu className="SelectMenu left-md-0 left-lg-auto right-md-auto right-lg-0" role="menu">
			<div className='SelectMenu-modal'>
				<header className='SelectMenu-header'>
					<span className='SelectMenu-title'>Select topic</span>
					<button className='SelectMenu-closeButton' type='button' data-toggle-for="topic-options">
						<svg aria-label="Close menu" aria-hidden="false" role="img" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-x">
    						<path fill-rule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
						</svg>
					</button>
				</header>
				<div className='SelectMenu-list' id='topic_menu_list'>
					<label className="SelectMenu-item" role="menuitemradio" tab-index="0" aria-checked="true">
						<input type="radio" name="topic" id="topic_" hidden={true} data-autosubmit="true" checked={true} onClick={(event) => {
							event.currentTarget.setAttribute("checked", "true")
							clearSearch()
							}}/>
							<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-check SelectMenu-icon SelectMenu-icon--check">
								<path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
							</svg>
						<span>None</span>
					</label>
				</div>
			</div>
		</details-menu>
	</details>
	
	let sort_button = document.getElementById("sort-options")
	console.log(sort_button)
	if(sort_button == null){
		return
	}
	console.log(type_button)
	type_button.insertBefore(button, sort_button)
}

function addTopicsToButton(topics:Array<string>): void{
	let menu_list = document.getElementById("topic_menu_list")
	
	topics.map((topic) => {
		let element = (<label className="SelectMenu-item" role="menuitemradio" tab-index="0" aria-checked="false">
			<input type="radio" name="topic" id="topic_" hidden={true} data-autosubmit="true" onClick={(event) => {
				console.log("Selected " + topic)
				event.currentTarget.setAttribute("checked", "true")
				checkSearch(topic)
				}}/>
			<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-check SelectMenu-icon SelectMenu-icon--check">
				<path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
			</svg>
			<span>{topic}</span>
		</label>)
		menu_list?.appendChild(element)
	})
}

function clearSearch(): void {
	const searchbar = document.getElementById("your-repos-filter") as HTMLInputElement;
	console.log(searchbar)
	
	if(searchbar == null){
		return
	}
	
	let search_string = ""
	if(searchbar.value.includes("topic:")){
		let args = searchbar.value.split(' ')
		let delete_index = 0
		for (; delete_index < args.length; delete_index++) {
			if(args[delete_index].includes("topic:")){
				break
			}
		}

		delete args[delete_index]

		// reconstruct string
		args.map((arg) => {
			if(search_string != ""){
				search_string += " "
			}
			search_string += arg
		})
	}
	
	searchbar.value = search_string.trim()
	var event = new Event('input', {
		bubbles: true
	});
	
	searchbar.dispatchEvent(event)
}

function checkSearch(topic: string): void {
	const searchbar = document.getElementById("your-repos-filter") as HTMLInputElement | null;
	
	if(searchbar == null){
		return
	}
	
	let curr_value = searchbar?.value
	
	let search_string = ""
	if(curr_value?.includes("topic:")){
		let args = curr_value.split(' ')
		let delete_index = 0
		for (; delete_index < args.length; delete_index++) {
			if(args[delete_index].includes("topic:")){
				break
			}
		}

		delete args[delete_index]

		// reconstruct string
		args.map((arg) => {
			if(search_string != ""){
				search_string += " "
			}
			search_string += arg
		})
	} else {
		search_string = curr_value
	}
	
	search_string += " topic:" + topic

	searchbar.value = search_string
	
	var event = new Event('input', {
		bubbles: true,
		cancelable: true,
	});
	
	searchbar?.dispatchEvent(event)
}

async function getData(org: string, after?: string): Promise<Set<string>>{
	let str = `
	organization(login: "${org}") {
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
	result["organization"]["repositories"]["nodes"].forEach((repo: any) => {
		repo["repositoryTopics"]["edges"].forEach((node: any) => {
			topics.add(node["node"]["topic"]["name"])
		});
	});

	if(result.organization.repositories.pageInfo.hasNextPage){
		topics = new Set([...topics, ...await getData(org, result.organization.repositories.pageInfo.endCursor)])
	}
	
	return topics
}

async function getTopics(org: string): Promise<Set<string>>{
	return getData(org)
}

function init(): void {
	let d = Node.prototype.dispatchEvent;
	Node.prototype.dispatchEvent = function (...a) {
		console.log(...a);
		// debugger; // Uncomment when necessary
		d.apply(this, a);
		return false
	}
	const org = location.pathname.split('/')[1]
	
	getTopics(org).then((topics) => {
		let sorted_topics = Array.from(topics).sort()
		console.log(sorted_topics)
		addTopicsToButton(sorted_topics)
	})
	addButton()
}

void features.add(import.meta.url, {
	include: [
		pageDetect.isProfile // Find which one you need on https://fregante.github.io/github-url-detection/
	],
	init
});