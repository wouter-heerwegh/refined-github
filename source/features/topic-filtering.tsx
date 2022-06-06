import * as pageDetect from 'github-url-detection';
import React from 'react';
import features from '.';
import * as api from '../github-helpers/api';

function addButton(topics: Array<string>): void {
	const type_button = document.getElementById("type-options")?.parentNode;
	console.log(type_button);
	if(type_button == null){
		return
	}

	let button = <details className="details-reset details-overlay position-relative mt-1 mt-lg-0 ml-1" id="topic-options">
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
				<div className='SelectMenu-list'>
					<label className="SelectMenu-item" role="menuitemradio" tab-index="0" aria-checked="false">
						<input type="radio" name="topic" id="topic_" data-autosubmit="true" onClick={() => {
							clearSearch()
							}}/>
						<span>None</span>
					</label>
					{
						topics.map((topic) => {
							return (<label className="SelectMenu-item" role="menuitemradio" tab-index="0" aria-checked="false">
								<input type="radio" name="topic" id="topic_" data-autosubmit="true" onClick={() => {
									console.log("Selected " + topic)
									checkSearch(topic)
									}}/>
								<span>{topic}</span>
							</label>)
						})
					}
				</div>
			</div>
		</details-menu>
	</details>

type_button.append(button)
}

function clearSearch(): void {
	const searchbar = document.getElementById("your-repos-filter") as HTMLInputElement | null;
	console.log("Commit info: ", searchbar)
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
			search_string += " " + arg
		})
	}
	searchbar?.setAttribute("value", search_string)
	
	var event = new Event('input', {
		bubbles: true,
		cancelable: true,
	});
	
	searchbar?.dispatchEvent(event)
}

function checkSearch(topic: string): void {
	const searchbar = document.getElementById("your-repos-filter") as HTMLInputElement | null;
	console.log("Commit info: ", searchbar)
	searchbar?.setAttribute("value", "topic:" + topic)
	
	var event = new Event('input', {
		bubbles: true,
		cancelable: true,
	});
	
	searchbar?.dispatchEvent(event)
}


async function getTopics(org : String): Promise<Set<string>> {
	// Get topics of org
	const result = await api.v4(`
		organization(login: "${org}") {
			repositories (first: 100) {
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
	)
	
	const topics = new Set<string>()
	
	result["organization"]["repositories"]["nodes"].forEach((repo: any) => {
		repo["repositoryTopics"]["edges"].forEach((node: any) => {
			topics.add(node["node"]["topic"]["name"])
		});
	});
	
	return topics
}

function init(): void {
	const org = location.pathname.split('/')[1]
	
	getTopics(org).then((topics: Set<string>) => {
		console.log(topics)
		addButton(Array.from(topics))
	})
	
}

void features.add(import.meta.url, {
	include: [
		pageDetect.isProfile // Find which one you need on https://fregante.github.io/github-url-detection/
	],
	init
});