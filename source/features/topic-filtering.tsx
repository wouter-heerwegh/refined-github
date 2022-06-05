import * as pageDetect from 'github-url-detection';
import features from '.';
import * as api from '../github-helpers/api';


function checkSearch(): void {
	const searchbar = document.getElementById("your-repos-filter") as HTMLInputElement | null;
	console.log("Commit info: ", searchbar)
	searchbar?.setAttribute("value", "topic:electric")
	
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
	})
	
	checkSearch()
	
	
	
}

void features.add(import.meta.url, {
	include: [
		pageDetect.isProfile // Find which one you need on https://fregante.github.io/github-url-detection/
	],
	init
});